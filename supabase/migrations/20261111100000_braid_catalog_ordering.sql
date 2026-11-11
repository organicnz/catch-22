-- Adjust braid product timestamps so that standard created_at DESC queries
-- list all braid spools in strict weight order (10lb -> 120lb) for each length
-- (300m -> 500m -> 1000m). Fixes GH Issue #38.

-- 300m braid spools (top of braid showcase)
update products set created_at = '2026-04-29 05:00:27+00' where name = '300m 10lb';
update products set created_at = '2026-04-29 05:00:26+00' where name = '300m 18lb';
update products set created_at = '2026-04-29 05:00:25+00' where name = '300m 28lb';
update products set created_at = '2026-04-29 05:00:24+00' where name = '300m 40lb';
update products set created_at = '2026-04-29 05:00:23+00' where name = '300m 50lb';
update products set created_at = '2026-04-29 05:00:22+00' where name = '300m 60lb';
update products set created_at = '2026-04-29 05:00:21+00' where name = '300m 80lb';
update products set created_at = '2026-04-29 05:00:20+00' where name = '300m 100lb';
update products set created_at = '2026-04-29 05:00:19+00' where name = '300m 120lb';

-- 500m braid spools
update products set created_at = '2026-04-29 05:00:18+00' where name = '500m 10lb';
update products set created_at = '2026-04-29 05:00:17+00' where name = '500m 18lb';
update products set created_at = '2026-04-29 05:00:16+00' where name = '500m 28lb';
update products set created_at = '2026-04-29 05:00:15+00' where name = '500m 40lb';
update products set created_at = '2026-04-29 05:00:14+00' where name = '500m 50lb';
update products set created_at = '2026-04-29 05:00:13+00' where name = '500m 60lb';
update products set created_at = '2026-04-29 05:00:12+00' where name = '500m 80lb';
update products set created_at = '2026-04-29 05:00:11+00' where name = '500m 100lb';
update products set created_at = '2026-04-29 05:00:10+00' where name = '500m 120lb';

-- 1000m braid spools
update products set created_at = '2026-04-29 05:00:09+00' where name = '1000m 10lb';
update products set created_at = '2026-04-29 05:00:08+00' where name = '1000m 18lb';
update products set created_at = '2026-04-29 05:00:07+00' where name = '1000m 28lb';
update products set created_at = '2026-04-29 05:00:06+00' where name = '1000m 40lb';
update products set created_at = '2026-04-29 05:00:05+00' where name = '1000m 50lb';
update products set created_at = '2026-04-29 05:00:04+00' where name = '1000m 60lb';
update products set created_at = '2026-04-29 05:00:03+00' where name = '1000m 80lb';
update products set created_at = '2026-04-29 05:00:02+00' where name = '1000m 100lb';
update products set created_at = '2026-04-29 05:00:01+00' where name = '1000m 120lb';
