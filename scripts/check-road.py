import json,math
from pathlib import Path
base=Path(__file__).resolve().parent.parent
R=json.load(open(base/'public/data/closed-road.geojson'))['features'];R=[f for f in R if f['properties']['id']=='03S11']
xf=111320*math.cos(math.radians(37.64));yf=111320
project=lambda p:(p[0]*xf,p[1]*yf)
roadsegments=[]
for f in R:
 c=[project(p) for p in f['geometry']['coordinates']]
 for a,b in zip(c,c[1:]):roadsegments.append((a,b))
def nearest(p):
 ans=1e20
 for a,b in roadsegments:
  vx,vy=b[0]-a[0],b[1]-a[1];den=vx*vx+vy*vy
  t=max(0,min(1,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/den)) if den else 0
  ds=(p[0]-a[0]-t*vx)**2+(p[1]-a[1]-t*vy)**2
  ans=min(ans,ds)
 return math.sqrt(ans)
route=next(f for f in json.load(open(base/'public/data/route-lines.geojson'))['features'] if f['properties']['routeId']=='safe' and f['properties']['day']==1)
minimum=(1e20,None);near=[];length=0
for line in route['geometry']['coordinates']:
 for a0,b0 in zip(line,line[1:]):
  a,b=project(a0),project(b0);l=math.hypot(b[0]-a[0],b[1]-a[1]);n=max(1,math.ceil(l/5))
  for i in range(n):
   t=(i+.5)/n;p=(a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]));d=nearest(p)
   if d<minimum[0]:minimum=(d,(p[0]/xf,p[1]/yf))
   if d<60.96:near.append((p[0]/xf,p[1]/yf,d));length+=l/n
result={'source':'USFS EDW RoadBasic 03S11 geometry; approximate equirectangular distances sampled every<=5m. GIS analysis is not ranger authorization.','roadSegments':len(roadsegments),'minDistanceMetres':minimum[0],'closestRouteCoordinate':minimum[1],'approxLengthWithin200ftMetres':length,'samplePointsWithin200ft':near}
print(json.dumps({k:v for k,v in result.items() if k!='samplePointsWithin200ft'},indent=2));json.dump(result,open(base/'public/data/route-road-check.json','w'),indent=2)
