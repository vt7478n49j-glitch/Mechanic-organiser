/* Template IDs stay stable; every inspection stores its own template snapshot. */
window.MMInspectionSections = [
 ['Identity & documents',[
 'Registration matches vehicle','VIN plate condition','VIN matches documents','Stamped VIN consistency','Make / model identification','Mileage display and units','Service book / digital record','Service invoices','MOT certificate / history supplied','Ownership / V5C evidence','Keys and spare keys','Recall evidence supplied']],
 ['Body & exterior',[
 'Front bumper','Rear bumper','Bonnet','Tailgate / boot lid','Left front wing','Right front wing','Left rear quarter','Right rear quarter','Left doors','Right doors','Paint finish / colour match','Panel gaps / alignment','Accident repair evidence','Visible corrosion','Exterior trim / mirrors','Underbody visible structure']],
 ['Glass, lights & visibility',[
 'Windscreen condition','Side glass','Rear glass','Window operation','Windscreen wipers','Screen washers','Headlamp dipped beam','Headlamp main beam','Side / daytime running lamps','Indicators / hazards','Brake lamps','Rear / registration lamps','Fog lamps','Mirror adjustment / visibility']],
 ['Cabin & safety',[
 'Driver seat condition / adjustment','Passenger seats','Seat belts and buckles','Belt warning operation','Airbag warning sequence','Dashboard condition','Instrument illumination','Horn','Steering wheel controls','Door locks / central locking','Interior door releases','Child locks','Heating output','Air conditioning output','Demister operation','Infotainment / audio','Interior water ingress','Boot / load area condition']],
 ['Engine & fuel system',[
 'Cold start behaviour|ice','Idle quality|ice','Engine noise|ice','Engine oil level|ice','Oil condition / contamination|ice','Oil filler / crankcase evidence|ice','Visible oil leaks|ice','Coolant level|ice','Coolant condition|ice','Cooling system visible leaks|ice','Hoses / radiator condition|ice','Auxiliary drive belt|ice','Timing service evidence|ice','Fuel lines / leaks|ice','Turbo / intake pipework|ice','Diesel DPF / AdBlue warnings|diesel']],
 ['Electrical & powertrain',[
 '12V battery condition','12V battery voltage','Charging voltage|ice','Starter operation|ice','Diagnostic socket access','Diagnostic fault codes recorded','Warning lamp self-test','Wiring visible condition','EV / hybrid ready mode|ev','Traction battery reported state of health|ev','HV warning indications|ev','Charge port / flap|ev','Charging cable visible condition|ev','Charging function observed|ev']],
 ['Transmission & driveline',[
 'Clutch pedal action|manual','Clutch bite / slip|manual','Manual gear selection|manual','Clutch hydraulic leaks|manual','Automatic engagement D / R|auto','Automatic shift quality|auto','Automatic fluid evidence / leaks|auto','Transmission warning indicators','Gearbox casing / mounts','Visible transmission leaks','Driveshaft boots','Driveshaft joints','Propshaft / joints where fitted','Differential leaks / noise','Four wheel drive operation where fitted','Final drive behaviour']],
 ['Steering & suspension',[
 'Steering free play','Power assistance','Steering rack / visible leaks','Steering joints / boots','Front left damper / spring','Front right damper / spring','Rear left damper / spring','Rear right damper / spring','Front suspension arms / bushes','Rear suspension arms / bushes','Anti-roll bars / links','Wheel bearing play / noise','Ride height / stance','Suspension noise']],
 ['Brakes',[
 'Brake pedal feel / travel','Brake fluid level','Brake fluid moisture reading','Master cylinder / visible leaks','Visible rigid brake pipes','Flexible brake hoses','Front left pad / disc','Front right pad / disc','Rear left pad / disc or drum','Rear right pad / disc or drum','Parking brake operation','ABS warning sequence','Brake balance on road test','Brake vibration / noise']],
 ['Wheels & tyres',[
 'Front left tread depth','Front right tread depth','Rear left tread depth','Rear right tread depth','Front left tyre condition / age','Front right tyre condition / age','Rear left tyre condition / age','Rear right tyre condition / age','Tyre sizes / load ratings match','Tyre pressures','Wheel condition','Wheel fixings visible','Spare / repair kit','TPMS warning / operation']],
 ['Underbody & exhaust',[
 'Front subframe visible condition','Rear subframe visible condition','Floor pan visible condition','Sills / jacking points','Undertrays / protection','Exhaust mounting|ice','Exhaust visible leaks|ice','Exhaust smoke|ice','Catalyst / emissions hardware visible|ice','Fuel tank visible condition|ice','Traction battery enclosure visible|ev','HV cabling visible condition|ev']],
 ['Road test & final checks',[
 'Road test permission / cover confirmed','Acceleration response','Straight line tracking','Cruise speed behaviour','Vibration at speed','Overrun / deceleration noise','Operating temperature / warnings','Hot restart / ready cycle','Post-test visible leaks','Accessories supplied','Security alarm where fitted','Final diagnostic recheck']]
].map((s,si)=>({id:'s'+si,name:s[0],items:s[1].map((v,ii)=>{const [name,applies='all']=v.split('|');return {id:'s'+si+'i'+ii,name,applies};})}));
