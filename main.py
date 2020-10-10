from connbase import *
from hashlib import sha256
import os
from fastapi.responses import FileResponse
from markdown2 import markdown

EXTRAS = [
    'break-on-newline',
    'cuddled-lists',
    'header-ids',
    'nofollow',
    'strike',
    'target-blank-links',
    'tables'
]

class MainApp(App):
    def create_connection(self, fingerprint):
        conn = super().create_connection(fingerprint)
        self.cache_all()
        self.users = self.load_cache()
        usr = None
        for u in self.users.keys():
            if self.users[u]['owner'] == fingerprint:
                usr = u
                break
        if usr == None:
            usr = sha256(fingerprint.encode('utf-8')).hexdigest()
            self.users[usr] = {
                'owner':fingerprint,
                'funds':0,
                'inventory':[],
                'name':'Citizen #'+str(1+len(list(self.users.keys()))),
                'events':[]
            }
            self.users[usr]['events'].append({
                'type':'toast',
                'text':'Welcome!'
            })
            conn['update'] = True
        conn['current_user'] = usr
        self.cache_all()
        return conn
    
    def broadcast(self,event,user=None):
        for u in self.users.keys():
            if u == user or user == None:
                self.users[u]['events'].append(event)
                self.update(self.users[u]['owner'])

app = MainApp()
if not os.path.exists('users.json'):
    with open('users.json','w') as f:
        f.write('{}')

@app.app.post('/user/name/')
async def change_name(fingerprint: str,name: str, response: Response):
    if not app.check_fp(fingerprint):
        response.status_code = status.HTTP_404_NOT_FOUND
        return
    app.users[app.connections[fingerprint]['current_user']]['name'] = name
    app.update(fingerprint)
    return

@app.app.get('/info/')
async def get_info(infoName: str, response: Response):
    if infoName+'.md' in os.listdir('info_db'):
        with open(os.path.join('info_db',infoName+'.md'),'r') as imd:
            return {
                'content':markdown(imd.read(),extras=EXTRAS)
            }
    else:
        return {
            'content':'<div>No content provided for INFO_'+infoName+'. Please contact system administrator.</div>'
        }

@app.app.post('/user/events/dequeue')
async def dequeue(fingerprint: str, response: Response):
    if not app.check_fp(fingerprint):
        response.status_code = status.HTTP_404_NOT_FOUND
        return
    if len(app.users[app.connections[fingerprint]['current_user']]['events']) > 0:
        del app.users[app.connections[fingerprint]['current_user']]['events'][0]
        app.update(fingerprint)
        return
    else:
        response.status_code = status.HTTP_204_NO_CONTENT
        return

# Load all static files in web/
@app.app.get('/',include_in_schema=False)
async def web_main():
    return FileResponse(os.path.join('web','index.html'))

static = os.walk('web')
files = {}
for folder in list(static):
    for f in folder[2]:
        files['/'.join(folder[0].split(os.sep))+'/'+f] = os.path.abspath(folder[0] + os.sep + f)

for f in files.keys():
    code = '\n'.join([
        '@app.app.get("/'+f.split('web/',maxsplit=1)[1]+'",include_in_schema=False)',
        'async def web_'+f.split('/')[len(f.split('/'))-1].replace('.','_').replace('-','_').replace(' ','_').replace('\'','').replace('"','')+'():',
        '\treturn FileResponse(r"'+files[f]+'")'
    ])
    exec(
        code,
        globals(),
        locals()
    )

app.run()