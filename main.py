from connbase import *
from hashlib import new, sha256
import os
from fastapi.responses import FileResponse
from markdown2 import markdown
import random
from pydantic import BaseModel

EXTRAS = [
    'break-on-newline',
    'cuddled-lists',
    'header-ids',
    'nofollow',
    'strike',
    'target-blank-links',
    'tables'
]

MAX_BOT_ITEMS = 3

ADJS = ['Shiny','Weird','Strange','Heavy','Light','Potato-Shaped','Really Expensive','Small','Large','Long','Stubby']
COLORS = ['Red','Blue','Green','Purple','Yellow','Orange','Dark Blue','Black','Gray','Light Gray','White']


class MainApp(App):
    def __init__(
            self,
            user_management=True,
            session_timeout=30,
            user_cache='users.json',
            c_rate=1.5
        ):
        super().__init__()
        self.conversion_rate = c_rate
        self.news = []
        self.purchases = []

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
                'id':usr,
                'owner':fingerprint,
                'funds':50,
                'dollars':50,
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

for i in range(5):
    usr = sha256(str(random.random()).encode('utf-8')).hexdigest()
    app.users[usr] = {
        'id':usr,
        'owner':'system',
        'funds':50,
        'dollars':0,
        'inventory':[],
        'name':'Bot #'+str(1+len(list(app.users.keys()))),
        'events':[]
    }
app.cache_all()
app.users = app.load_cache()

@app.app.get('/server/')
async def get_server():
    return {
        'conversion_rate':app.conversion_rate,
        'news':app.news
    }

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

class PurchaseModel(BaseModel):
    fingerprint: str
    name: str
    price: int
    id: str
    uid: str

@app.app.post('/user/items/purchase/')
async def purchase(fingerprint: str, name: str, price: str, id: str, uid: str, response: Response):
    price = int(price)
    if not app.check_fp(fingerprint):
        response.status_code = status.HTTP_404_NOT_FOUND
        return
    found = False
    for u in app.users:
        if u == uid:
            found = True
            break
    if not found:
        response.status_code = status.HTTP_404_NOT_FOUND
        return
    if price > app.users[app.connections[fingerprint]['current_user']]['funds']:
        response.status_code = status.HTTP_403_FORBIDDEN
        return
    app.users[app.connections[fingerprint]['current_user']]['funds'] -= price
    app.users[app.connections[fingerprint]['current_user']]['inventory'].append({
        'id':sha256(str(time.time()*random.random()).encode('utf-8')).hexdigest(),
        'name':name,
        'price':price,
        'for_sale':False
    })
    app.purchases.append({
        'username':app.users[app.connections[fingerprint]['current_user']]['name'],
        'item_name':name,
        'price':price
    })
    app.users[uid]['funds'] += price
    for i in range(len(app.users[uid]['inventory'])):
        if app.users[uid]['inventory'][i]['id'] == id:
            del app.users[uid]['inventory'][i]
            break
    
    app.update(fingerprint)
    return

@app.app.post('/user/items/edit/{item}/')
async def edit_item(item,fingerprint: str, key: str, value: str, response: Response):
    if not app.check_fp(fingerprint):
        response.status_code = status.HTTP_404_NOT_FOUND
        return
    if key == 'name':
        val = str(value)
    elif key == 'price':
        val = int(value)
    elif key == 'for_sale':
        if value == 'true':
            val = True
        else:
            val = False
    else:
        response.status_code = status.HTTP_405_METHOD_NOT_ALLOWED
        return
    for i in range(len(app.users[app.connections[fingerprint]['current_user']]['inventory'])):
        if app.users[app.connections[fingerprint]['current_user']]['inventory'][i]['id'] == item:
            app.users[app.connections[fingerprint]['current_user']]['inventory'][i][key] = val
            app.update(fingerprint)
            return
    response.status_code = status.HTTP_404_NOT_FOUND
    return

@app.app.post('/user/funds/edit/')
async def edit_funds(fingerprint: str, fibra: float, dollars: float, response: Response):
    if not app.check_fp(fingerprint):
        response.status_code = status.HTTP_404_NOT_FOUND
        return
    app.users[app.connections[fingerprint]['current_user']]['funds'] = fibra
    app.users[app.connections[fingerprint]['current_user']]['dollars'] = dollars
    return

@app.app.on_event('startup')
@repeat_every(seconds=5)
async def simloop():
    app.cache_all()
    app.users = app.load_cache()
    with open('items.json','r') as f:
        items = json.load(f)
    newitem = False
    for u in app.users.keys():
        if app.users[u]['owner'] == 'system' and random.randint(0,100) > 95 and len(app.users[u]['inventory']) < MAX_BOT_ITEMS:
            item = random.choice(items)
            app.users[u]['inventory'].append({
                'id':sha256(str(time.time()*random.random()).encode('utf-8')).hexdigest(),
                'name':str(item['name']).format(
                        adj=random.choice(ADJS),
                        adj2=random.choice(ADJS),
                        adj3=random.choice(ADJS),
                        color=random.choice(COLORS),
                        color2=random.choice(COLORS),
                        color3=random.choice(COLORS)
                    ),
                'price':item['price']+max([1,random.randint(-10,10)]),
                'for_sale':True
            })
            newitem = True
        if app.users[u]['owner'] == 'system' and len(app.users[u]['inventory']) < MAX_BOT_ITEMS:
            usr = {'owner':'system'}
            c = 0
            while usr['owner'] == 'system' and c < 2*len(app.users.values()):
                usr = random.choice(list(app.users.values()))
                c+=1
            if not usr['owner'] == 'system':
                old_inv = []
                for i in range(len(usr['inventory'])):
                    if usr['inventory'][i]['for_sale'] and random.random() > float(int(app.users[u]['funds']) / int(usr['inventory'][i]['price']*1.2)):
                        app.users[usr['id']]['funds'] += usr['inventory'][i]['price']
                        app.users[u]['funds'] -= usr['inventory'][i]['price']
                        usr['inventory'][i]['for_sale'] = True
                        usr['inventory'][i]['price'] += random.randint(-2,15);
                        app.users[u]['inventory'].append(usr['inventory'][i].copy())
                        app.broadcast({
                            'type':'toast',
                            'text':app.users[u]['name'] + ' has bought your ' + usr['inventory'][i]['name'] + '.'
                        },user=usr['owner'])
                    else:
                        old_inv.append(usr['inventory'][i].copy())
                app.users[usr['id']]['inventory'] = old_inv[:]
    if newitem:
        for i in app.users.keys():
            app.update(app.users[i]['owner'])
    
    with open('news_template.json','r') as f:
        ntemp = json.load(f)
    npurch = []
    for i in range(len(app.purchases)):
        if random.random() > 0.3:
            app.news.append(str(random.choice(ntemp)).format(name=app.purchases[i]['username'],item=app.purchases[i]['item_name'],price=app.purchases[i]['price']))
        else:
            npurch.append(app.purchases[i].copy())
    app.purchases = npurch[:]
            

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