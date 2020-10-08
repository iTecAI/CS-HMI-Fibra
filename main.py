from connbase import *
from hashlib import sha256
import os
from fastapi.responses import FileResponse

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
                'inventory':[]
            }
        conn['current_user'] = usr
        self.cache_all()
        return conn

app = MainApp()
if not os.path.exists('users.json'):
    with open('users.json','w') as f:
        f.write('{}')

# Load all static files in web/
static = os.walk('web')
files = {}
for folder in list(static):
    for f in folder[2]:
        files['/'.join(folder[0].split(os.sep))+'/'+f] = os.path.join(folder[0],f)

for f in files.keys():
    code = '\n'.join([
        '@app.app.get("/'+f.split('web/',maxsplit=1)[1]+'")',
        'async def web_'+f.split('/')[len(f.split('/'))-1].replace('.','_').replace('-','_').replace(' ','_').replace('\'','').replace('"','')+'():',
        '\treturn FileResponse("'+files[f]+'")'
    ])
    exec(
        code,
        globals(),
        locals()
    )

app.run()