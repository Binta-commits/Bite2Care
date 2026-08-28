-- Fallback SQL seed for demo data. Run this against the SQLite DB after prisma db push creates tables.

BEGIN TRANSACTION;

-- Facilities
INSERT INTO "Facility" ("id","name","capabilityLevel","hasIcuHdu","canDo20WBCT","latitude","longitude") VALUES ('00000000-0000-0000-0000-00000000000A','General Hospital A',3,1,1,NULL,NULL);
INSERT INTO "Facility" ("id","name","capabilityLevel","hasIcuHdu","canDo20WBCT","latitude","longitude") VALUES ('00000000-0000-0000-0000-00000000000B','Rural Clinic B',2,0,1,NULL,NULL);
INSERT INTO "Facility" ("id","name","capabilityLevel","hasIcuHdu","canDo20WBCT","latitude","longitude") VALUES ('00000000-0000-0000-0000-00000000000C','Central Medical Hub',3,1,1,NULL,NULL);

-- Facility readiness
INSERT INTO "FacilityReadiness" ("id","facilityId","antivenomStatus","quantity","lastUpdated") VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000A','IN_STOCK',20,datetime('now'));
INSERT INTO "FacilityReadiness" ("id","facilityId","antivenomStatus","quantity","lastUpdated") VALUES ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000B','OUT_OF_STOCK',0,datetime('now'));
INSERT INTO "FacilityReadiness" ("id","facilityId","antivenomStatus","quantity","lastUpdated") VALUES ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000000C','IN_STOCK',50,datetime('now'));

-- Transport providers
INSERT INTO "TransportProvider" ("id","name","phone","available","createdAt") VALUES ('20000000-0000-0000-0000-000000000001','Motorcycle/Tricycle (Keke)','0803 XXX XXXX',1,datetime('now'));
INSERT INTO "TransportProvider" ("id","name","phone","available","createdAt") VALUES ('20000000-0000-0000-0000-000000000002','Formal Ambulance','0805 XXX XXXX',1,datetime('now'));

COMMIT;
