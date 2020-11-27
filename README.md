##Indexer for Ethereum / RSK
// https://github.com/Adamant-im/ETH-transactions-storage

### Prerequisites

* geth or parity (eth) / rsk node
* Postgresql 10.5
* Postgrest
* nginx (in case of public API)
* pm2

### Install and create database postgres  
sudo apt update  
sudo apt install postgresql postgresql-contrib  
sudo -u postgres psql  
CREATE DATABASE index;  
CREATE USER root;  
ALTER USER root WITH SUPERUSER;  
ALTER USER root WITH PASSWORD 'root';  
\q  

psql -f create_table.sql <yourDB>

To check indexing process, get the last indexed block:  
psql -d index -c 'SELECT MAX(block) FROM ethtxs;'

## Install 
git clone  
npm install  
create .env  
npm run build  
pm2 start build/main.js --name "process_name"  

## config

STEP_TYPE=forward | back

if STEP_TYPE is back set FROM_BLOCK & TO_BLOCK

example:  
FROM_BLOCK=8606276
TO_BLOCK=7000000

NODE_PROVIDER=HTTP | ICP  

if NODE_PRIVER HTTP set HTTP_NODE, if ICP_FOLDER
HTTP_NODE="http://198.199.89.10:8080"  
ICP_FOLDER="/mnt/volume_nyc1_01/etherum/geth.ipc"  



## create postgREST config  
// postgrest.conf

create dir and create postgrest.conf file

db-uri = "postgres://{username}@/{dbname}"  
db-schema = "public"  
db-anon-role = "{username}"  
db-pool = 10  
server-host = "127.0.0.1"  
server-port = 3000  

## install postgREST

wget https://github.com/PostgREST/postgrest/releases/download/v7.0.1/postgrest-v7.0.1-linux-x64-static.tar.xz  
tar -xvf postgrest-[version]-[platform].tar.xz  
./postgrest ./postgrest.conf

### Make Indexer's API public
If you need to provide public API, use any webserver like nginx and setup proxy to Postgrest port in config:

sudo nano /etc/nginx/sites-available/default

location /ethtxs {  
    proxy_pass http://127.0.0.1:3000;  
}  

location /aval {  
    proxy_pass http://127.0.0.1:3000;  
}  

This way two endpoints will be available:

/ethtxs used to fetch Ethereum transactions by address  
/aval returns status of service  
Endpoint aval is a table with status field just to check API aviablity. Though it is not necessary, you can add it by creating aval table:  

CREATE TABLE public.aval  
(  
    "status" INTEGER  
)  

TABLESPACE pg_default;  

INSERT INTO public.aval(status) VALUES (1);  

## Examples

Get last 25 Ethereum transactions without ERC-20 transactions for address 0x1143e097e134f3407ef6b088672ccece9a4f8cdd:

https://ethnode1.adamant.im/ethtxs?and=(contract_to.eq.,or(txfrom.eq.0x1143e097e134f3407ef6b088672ccece9a4f8cdd,txto.eq.0x1143e097e134f3407ef6b088672ccece9a4f8cdd))&order=time.desc&limit=25


## create cronotab

@reboot /{dir}/postgrest /{dir}/postgrest.conf
