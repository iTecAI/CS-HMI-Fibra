from connbase import *
from hashlib import new, sha256
import os
from fastapi.responses import FileResponse
from markdown2 import markdown
import random

EXTRAS = [
    'break-on-newline',
    'cuddled-lists',
    'header-ids',
    'nofollow',
    'strike',
    'target-blank-links',
    'tables'
]

MAX_BOT_ITEMS = 5

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

for i in range(20):
    usr = sha256(str(random.random()).encode('utf-8')).hexdigest()
    app.users[usr] = {
        'owner':'system',
        'funds':0,
        'inventory':[],
        'name':'Bot #'+str(1+len(list(app.users.keys()))),
        'events':[]
    }
app.cache_all()
app.users = app.load_cache()

@app.app.post('/user/name/')
async def change_name(fingerprint: str,name: str, response: Response):
    if not app.check_fp(fingerprint):
        response.status_code = status.HTTP_404_NOT_FOUND
        return
    app.users[app.connections[fingerprint]['current_user']]['name'] = name
    app.update(fingerprint)
    return

@app.app.get('/user/all/')
async def get_users(response: Response):
    app.cache_all()
    app.users = app.load_cache()
    r_users = {}
    for u in app.users.keys():
        for_sale = []
        for item in app.users[u]['inventory']:
            if item['for_sale']:
                for_sale.append({
                    'id':item['id'],
                    'name':item['name'],
                    'seller':u,
                    'seller_name':app.users[u]['name'],
                    'price':item['price']
                })
        r_users[u] = {
            'name':app.users[u]['name'],
            'for_sale':for_sale
        }
    return r_users

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

@app.app.on_event('startup')
@repeat_every(seconds=5)
async def simloop():
    app.cache_all()
    app.users = app.load_cache()
    newitem = False
    for u in app.users.keys():
        if app.users[u]['owner'] == 'system' and random.randint(0,100) > 95 and len(app.users[u]['inventory']) < MAX_BOT_ITEMS:
            app.users[u]['inventory'].append({
                'id':sha256(str(time.time()*random.random()).encode('utf-8')).hexdigest(),
                'name':'An Item',
                'price':random.randint(1,200),
                'for_sale':True
            })
            newitem = True
    if newitem:
        for i in app.users.keys():
            app.update(app.users[i]['owner'])
            

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