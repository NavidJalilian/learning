/* System Design Quest — shared game engine.
 *
 * Every lesson loads this file and calls Quest.init({...}). The engine owns:
 *   - the HUD (back-to-map link, total XP + rank, hearts, clickable stage dots)
 *   - stage locking/unlocking, and saving progress after every change
 *   - resume (reload mid-quest → you're where you left off)
 *   - review mode (quest already cleared → replays are practice, no XP/hearts at stake)
 *   - no locks: every stage and every quest is open; order is suggested, never enforced
 *   - the victory card, prev/next lesson links, confetti
 *   - reusable widgets: quiz(), boss(), drill()
 *
 * Saved in localStorage under 'sdq:v1':
 *   { lessons: { "0001": { xp, stars, at } },          // best finished result per quest
 *     runs:    { "0002": { cleared: [1,2], xp, hearts } } } // an unfinished attempt
 */
(function () {
  'use strict';
  const STORE_KEY = 'sdq:v1';
  const RANKS = [[0, 'Intern'], [300, 'Junior'], [800, 'Mid-level'], [1500, 'Senior'], [2400, 'Staff'], [3200, 'Principal'],
    [5000, 'Senior Principal'], [8000, 'Distinguished'], [12000, 'Fellow'], [17000, 'Chief Architect'], [23000, 'Legend']];
  // One catalog for the quest map and the prev/next links, in book order. `file` is relative to lessons/.
  // `w` is the world (= book chapter). `ready: true` once the lesson file exists and has been checked.
  // WORLDS lists every chapter; `cheatsheet` is relative to reference/.
  const WORLDS = [
    { w: 1, t: 'Scale From Zero to Millions of Users', name: 'The Launchpad', slug: 'scale-from-zero-to-millions-of-users' },
    { w: 2, t: 'Back-of-the-Envelope Estimation', name: 'The Napkin Forge', slug: 'back-of-the-envelope-estimation', cheatsheet: 'ch02-estimation-cheatsheet.html' },
    { w: 3, t: 'A Framework for System Design Interviews', name: 'The Interview Arena', slug: 'a-framework-for-system-design-interviews' },
    { w: 4, t: 'Design a Rate Limiter', name: 'The Throttle Gate', slug: 'design-a-rate-limiter' },
    { w: 5, t: 'Design Consistent Hashing', name: 'The Ring Road', slug: 'design-consistent-hashing' },
    { w: 6, t: 'Design a Key-Value Store', name: 'The Key-Value Vault', slug: 'design-a-key-value-store', cheatsheet: 'kv-store-cap-cheatsheet.html' },
    { w: 7, t: 'Design a Unique ID Generator', name: 'The ID Mint', slug: 'design-a-unique-id-generator-in-distributed-systems', cheatsheet: 'ch07-unique-id-cheatsheet.html' },
    { w: 8, t: 'Design a URL Shortener', name: 'Shrink Ray Bay', slug: 'design-a-url-shortener', cheatsheet: 'ch08-url-shortener-cheatsheet.html' },
    { w: 9, t: 'Design a Web Crawler', name: 'Spider Web Wilds', slug: 'design-a-web-crawler' },
    { w: 10, t: 'Design a Notification System', name: 'Ping Station', slug: 'design-a-notification-system' },
    { w: 11, t: 'Design a News Feed System', name: 'Feedstream Falls', slug: 'design-a-news-feed-system' },
    { w: 12, t: 'Design a Chat System', name: 'Chatterbox Citadel', slug: 'design-a-chat-system' },
    { w: 13, t: 'Design a Search Autocomplete System', name: 'Typeahead Tower', slug: 'design-a-search-autocomplete-system' },
    { w: 14, t: 'Design YouTube', name: 'The Stream Machine', slug: 'design-youtube' },
    { w: 15, t: 'Design Google Drive', name: 'The Cloud Locker', slug: 'design-google-drive', cheatsheet: 'ch15-google-drive-cheatsheet.html' },
  ];
  const CATALOG = [
    { id: '0101', w: 1, n: '1.1', t: 'One Box Wonder', d: 'A single server, splitting off the database, SQL vs NoSQL, scaling up vs out, and the load balancer', file: '0101-scale-one-box-to-load-balancer.html', ready: false },
    { id: '0102', w: 1, n: '1.2', t: 'Copy the Ledger', d: 'Master/slave database replication: who takes writes, who takes reads, and what happens when one dies', file: '0102-scale-database-replication.html', ready: false },
    { id: '0103', w: 1, n: '1.3', t: 'Hot Memory, Near Edge', d: 'A cache tier for hot data and a CDN for static files: how they work and what can go wrong', file: '0103-scale-cache-and-cdn.html', ready: false },
    { id: '0104', w: 1, n: '1.4', t: 'Forget Me, Find Me Anywhere', d: 'Make the web tier stateless, autoscale it, then spread the system across data centers with GeoDNS', file: '0104-scale-stateless-and-data-centers.html', ready: false },
    { id: '0105', w: 1, n: '1.5', t: 'Queues, Gauges & Shards', d: 'Message queues to decouple work, logging/metrics/automation, and sharding the database', file: '0105-scale-queues-observability-sharding.html', ready: false },
    { id: '0106', w: 1, n: 'BOSS', t: 'Zero to Millions, Live', d: 'Mock interview: scale a startup\'s app from one server to millions of users as the traffic climbs', file: '0106-scale-boss-millions-live.html', boss: true, ready: false },
    { id: '0201', w: 2, n: '2.1', t: 'The Byte Ladder', d: 'Powers of two, data units, and doing big multiplications in your head', file: '0201-powers-of-two.html', ready: true },
    { id: '0202', w: 2, n: '2.2', t: 'Nanoseconds to Netherlands', d: 'Latency numbers every programmer should know, and the five lessons in them', file: '0202-latency-numbers.html', ready: true },
    { id: '0203', w: 2, n: '2.3', t: 'Count the Nines', d: 'Availability percentages, SLAs, and how much downtime each nine allows', file: '0203-availability-nines.html', ready: true },
    { id: '0204', w: 2, n: '2.4', t: 'Tweet Math', d: 'The book\'s worked example: Twitter\'s QPS and storage, step by step', file: '0204-twitter-qps-storage.html', ready: true },
    { id: '0205', w: 2, n: 'BOSS', t: 'The Estimation Gauntlet', d: 'Mock interview: estimate a Twitter-like service end to end, then survive the follow-ups', file: '0205-boss-estimation-gauntlet.html', boss: true, ready: true },
    { id: '0301', w: 3, n: '3.1', t: 'Rules of the Room', d: 'What the interviewer is really grading, the red flags, the 4-step clock, and the dos and don\'ts', file: '0301-rules-of-the-room.html', ready: false },
    { id: '0302', w: 3, n: '3.2', t: 'Ask Before You Build', d: 'Step 1: turn a vague prompt into a scoped problem with clarifying questions and written-down assumptions', file: '0302-ask-before-you-build.html', ready: false },
    { id: '0303', w: 3, n: '3.3', t: 'Blueprint & Buy-in', d: 'Step 2: sketch a box diagram, sanity-check it, and get the interviewer on board', file: '0303-blueprint-and-buy-in.html', ready: false },
    { id: '0304', w: 3, n: '3.4', t: 'Dive Deep, Land Clean', d: 'Steps 3 and 4: pick the right components to deep-dive, avoid rabbit holes, and close strong', file: '0304-dive-deep-land-clean.html', ready: false },
    { id: '0305', w: 3, n: 'BOSS', t: 'Run the Room', d: 'Full 45-minute mock interview of \'design a news feed\', then switch seats and grade another candidate', file: '0305-boss-run-the-room.html', boss: true, ready: false },
    { id: '0401', w: 4, n: '4.1', t: 'Bouncer at the Door', d: 'What a rate limiter is, why you need one, how to scope it, and where it should sit', file: '0401-rate-limiter-why-and-where.html', ready: false },
    { id: '0402', w: 4, n: '4.2', t: 'Token Tycoon', d: 'The two bucket algorithms: token bucket and leaking bucket', file: '0402-token-and-leaking-bucket.html', ready: false },
    { id: '0403', w: 4, n: '4.3', t: 'Windows of Time', d: 'Fixed window, sliding window log, and sliding window counter', file: '0403-window-algorithms.html', ready: false },
    { id: '0404', w: 4, n: '4.4', t: 'The Counter Room', d: 'Redis counters, rule files, 429 headers, and the detailed design', file: '0404-counters-rules-and-429s.html', ready: false },
    { id: '0405', w: 4, n: '4.5', t: 'Many Doors, One Count', d: 'Race conditions, syncing many limiters, multi-data-center speed, and monitoring', file: '0405-distributed-rate-limiting.html', ready: false },
    { id: '0406', w: 4, n: 'BOSS', t: 'Throttle It Live', d: 'Full mock interview: design a rate limiter', file: '0406-boss-throttle-it-live.html', boss: true, ready: false },
    { id: '0501', w: 5, n: '5.1', t: 'Ring Math', d: 'Count how many keys hash % N really moves, size up the hash space, look a key up in code, and find exactly which keys move when a server joins or leaves', file: '0501-consistent-hashing-ring-math.html', ready: false },
    { id: '0502', w: 5, n: '5.2', t: 'Cracks in the Ring', d: 'The two problems with the basic ring in numbers, why virtual nodes fix one of them, and who runs consistent hashing in production (Dynamo, Cassandra, Discord, Akamai, Maglev)', file: '0502-consistent-hashing-cracks-and-riders.html', ready: false },
    { id: '0503', w: 5, n: 'BOSS', t: 'Hash It Live', d: 'Full mock interview: design how a growing cache fleet decides which server holds each key', file: '0503-consistent-hashing-boss-hash-it-live.html', boss: true, ready: false },
    { id: '0001', w: 6, n: '6.1', t: 'The Key-Value Vault', d: 'put/get, single-server limits, CAP, CP vs AP', file: '0001-key-value-store-and-cap.html', ready: true },
    { id: '0002', w: 6, n: '6.2', t: 'Slice the Keyspace', d: 'Data partition with consistent hashing', file: '0002-consistent-hashing.html', ready: true },
    { id: '0003', w: 6, n: '6.3', t: 'Copies Everywhere', d: 'Data replication across nodes', file: '0003-replication.html', ready: true },
    { id: '0004', w: 6, n: '6.4', t: 'Majority Rules', d: 'Quorum consensus (N, W, R) and tunable consistency', file: '0004-quorum-consensus.html', ready: true },
    { id: '0005', w: 6, n: '6.5', t: 'Who Wrote Last?', d: 'Inconsistency resolution with versioning & vector clocks', file: '0005-vector-clocks.html', ready: true },
    { id: '0006', w: 6, n: '6.6', t: 'When Nodes Die', d: 'Gossip, sloppy quorum, hinted handoff, Merkle trees', file: '0006-handling-failures.html', ready: true },
    { id: '0007', w: 6, n: '6.7', t: 'The Write & Read Path', d: 'Commit log, memtable, SSTables, Bloom filters', file: '0007-write-and-read-path.html', ready: true },
    { id: '0008', w: 6, n: 'BOSS', t: 'Design It Live', d: 'Full mock interview: design a key-value store', file: '0008-boss-design-it-live.html', boss: true, ready: true },
    { id: '0701', w: 7, n: '7.1', t: 'Numbers Nobody Repeats', d: 'Why auto_increment breaks across servers, the 5 requirements, and multi-master \'count by k\'', file: '0701-unique-id-scope-and-multi-master.html', ready: true },
    { id: '0702', w: 7, n: '7.2', t: 'Dice or the Ticket Booth', d: 'UUIDs (random, no coordination) vs a central ticket server (numeric, single point of failure)', file: '0702-uuid-and-ticket-server.html', ready: true },
    { id: '0703', w: 7, n: '7.3', t: 'Anatomy of a Snowflake', d: 'Twitter Snowflake\'s 64-bit layout: mint an ID, decode one, and do the 69-year math', file: '0703-snowflake-bit-layout.html', ready: true },
    { id: '0704', w: 7, n: '7.4', t: 'When Clocks Lie', d: 'Sequence overflow, clocks running backwards, rough ordering, re-tuning the bits, keeping it available', file: '0704-snowflake-clocks-and-tuning.html', ready: true },
    { id: '0705', w: 7, n: 'BOSS', t: 'Mint It Live', d: 'Full mock interview: design a unique ID generator in distributed systems', file: '0705-boss-mint-it-live.html', boss: true, ready: true },
    { id: '0801', w: 8, n: '8.1', t: 'Specs for a Shrink Ray', d: 'Scope the prompt, do the napkin math, design the two API calls, and choose 301 or 302', file: '0801-url-shortener-scope-and-api.html', ready: true },
    { id: '0802', w: 8, n: '8.2', t: 'Seven Characters or Bust', d: 'Store the mapping, size the short code, and make hash + collision resolution work', file: '0802-url-shortener-hash-and-collisions.html', ready: true },
    { id: '0803', w: 8, n: '8.3', t: 'Count in Base 62', d: 'Turn a unique ID into a short code with base 62, and weigh it against hashing', file: '0803-url-shortener-base62.html', ready: true },
    { id: '0804', w: 8, n: '8.4', t: 'Shorten & Bounce', d: 'Walk the shortening and redirecting flows, add a cache, and scale it out', file: '0804-url-shortener-flows-and-scale.html', ready: true },
    { id: '0805', w: 8, n: 'BOSS', t: 'Shrink the Internet, Live', d: 'Full mock interview: design a URL shortener in 45 minutes', file: '0805-url-shortener-boss-design-it-live.html', boss: true, ready: true },
    { id: '0901', w: 9, n: '9.1', t: 'Release the Spider', d: 'What a crawler is for, the three-step loop, scoping questions, the four traits of a good crawler, and the napkin math', file: '0901-web-crawler-scope-and-estimates.html', ready: false },
    { id: '0902', w: 9, n: '9.2', t: 'Assemble the Spider', d: 'The eleven boxes of the high-level design, the two \'seen?\' checks, and the step-by-step crawl workflow', file: '0902-web-crawler-components-and-workflow.html', ready: false },
    { id: '0903', w: 9, n: '9.3', t: 'Taming the Frontier', d: 'Why BFS beats DFS but still isn\'t enough, and how front queues (priority) and back queues (politeness) fix it, plus freshness and storage', file: '0903-web-crawler-url-frontier.html', ready: false },
    { id: '0904', w: 9, n: '9.4', t: 'Fast Fangs, Thick Skin', d: 'robots.txt, four speed-ups for the downloader (distribute, cache DNS, go local, time out), and four ways to survive failures', file: '0904-web-crawler-downloader-and-robustness.html', ready: false },
    { id: '0905', w: 9, n: '9.5', t: 'Beware the Spider Traps', d: 'Plug-in modules for new content, dodging duplicates, spider traps and noise, and the wrap-up extras like rendering JavaScript', file: '0905-web-crawler-traps-and-extensibility.html', ready: false },
    { id: '0906', w: 9, n: 'BOSS', t: 'Crawl the Web, Live', d: 'Full mock interview: design a web crawler in 45 minutes', file: '0906-web-crawler-boss-design-it-live.html', boss: true, ready: false },
    { id: '1001', w: 10, n: '10.1', t: 'Three Roads to the Lock Screen', d: 'Push (APNs/FCM), SMS and email: who delivers what, and the contact info you need', file: '1001-notification-channels.html', ready: false },
    { id: '1002', w: 10, n: '10.2', t: 'Shatter the Single Server', d: 'From one notification box to servers, per-channel queues and workers', file: '1002-notification-high-level-design.html', ready: false },
    { id: '1003', w: 10, n: '10.3', t: 'Never Lose a Ping', d: 'Notification log, at-least-once, dedupe, retries and watching the queue', file: '1003-notification-reliability.html', ready: false },
    { id: '1004', w: 10, n: '10.4', t: 'Respect the Inbox', d: 'Templates, opt-in settings, rate limits, auth, event tracking and the final design', file: '1004-notification-guardrails.html', ready: false },
    { id: '1005', w: 10, n: 'BOSS', t: 'Ping the Planet — Live', d: 'Full mock interview: design a notification system', file: '1005-notification-boss-design-it-live.html', boss: true, ready: false },
    { id: '1101', w: 11, n: '11.1', t: 'Two Rivers', d: 'Scope a news feed, design its two APIs, and sketch the publish and read flows', file: '1101-news-feed-scope-and-flows.html', ready: false },
    { id: '1102', w: 11, n: '11.2', t: 'Push, Pull, or Both', d: 'Fanout on write vs fanout on read, the celebrity problem, and the hybrid fix', file: '1102-news-feed-fanout-push-vs-pull.html', ready: false },
    { id: '1103', w: 11, n: '11.3', t: 'The Fanout Factory', d: 'Inside publishing: auth and rate limits, the five-step fanout workflow, and an ID-only feed cache', file: '1103-news-feed-publishing-pipeline.html', ready: false },
    { id: '1104', w: 11, n: '11.4', t: 'Hydrate the Feed', d: 'Inside reading: turn post IDs into a full feed, serve media from a CDN, and the five cache layers', file: '1104-news-feed-retrieval-and-caches.html', ready: false },
    { id: '1105', w: 11, n: 'BOSS', t: 'Design It Live: News Feed', d: 'Full mock interview: design a news feed for 10 million daily users', file: '1105-news-feed-boss-design-it-live.html', boss: true, ready: false },
    { id: '1201', w: 12, n: '12.1', t: 'Open the Pipe', d: 'What a chat service does, and polling vs long polling vs WebSocket', file: '1201-chat-connections.html', ready: false },
    { id: '1202', w: 12, n: '12.2', t: 'The Switchboard', d: 'Stateless vs stateful services, the scaled design, and service discovery', file: '1202-chat-high-level-design.html', ready: false },
    { id: '1203', w: 12, n: '12.3', t: 'The Message Vault', d: 'Where chat history lives, the message tables, and how to mint message IDs', file: '1203-chat-storage-and-ids.html', ready: false },
    { id: '1204', w: 12, n: '12.4', t: 'Special Delivery', d: 'The 1-on-1 message flow, syncing many devices, and small-group fan-out', file: '1204-chat-message-flows.html', ready: false },
    { id: '1205', w: 12, n: '12.5', t: 'The Green Dot', d: 'Online presence: login/logout, heartbeats, and fanning out status changes', file: '1205-chat-online-presence.html', ready: false },
    { id: '1206', w: 12, n: 'BOSS', t: 'Design It Live: Chat', d: 'Full mock interview: design a chat system for 50 million daily users', file: '1206-chat-boss-design-it-live.html', boss: true, ready: false },
    { id: '1301', w: 13, n: '13.1', t: 'Every Keystroke Counts', d: 'Scope autocomplete, do the envelope math, and see why one SQL table can\'t keep up', file: '1301-autocomplete-scope-and-estimation.html', ready: false },
    { id: '1302', w: 13, n: '13.2', t: 'Grow the Trie', d: 'The trie data structure, top-k search, and two tricks that make it O(1)', file: '1302-trie-top-k.html', ready: false },
    { id: '1303', w: 13, n: '13.3', t: 'The Weekly Harvest', d: 'Logs, aggregators, workers: how the trie gets built, stored and updated', file: '1303-data-gathering-service.html', ready: false },
    { id: '1304', w: 13, n: '13.4', t: 'Faster Than a Keystroke', d: 'The query path, browser caching, data sampling, and the filter layer', file: '1304-query-service.html', ready: false },
    { id: '1305', w: 13, n: '13.5', t: 'Split the Alphabet', d: 'Shard the trie, balance hot letters, and handle languages, countries and trends', file: '1305-scaling-autocomplete.html', ready: false },
    { id: '1306', w: 13, n: 'BOSS', t: 'Autocomplete Live', d: 'Full mock interview: design search autocomplete', file: '1306-boss-autocomplete-live.html', boss: true, ready: false },
    { id: '1401', w: 14, n: '14.1', t: 'Size Up the Tube', d: 'Scope a YouTube clone and do the napkin maths for storage and CDN cost', file: '1401-youtube-scope-and-estimate.html', ready: false },
    { id: '1402', w: 14, n: '14.2', t: 'Upload Lane, Watch Lane', d: 'The high-level design: CDN, API servers, the video upload flow and the streaming flow', file: '1402-youtube-upload-and-stream-flows.html', ready: false },
    { id: '1403', w: 14, n: '14.3', t: 'The Format Forge', d: 'Why videos are transcoded, containers vs codecs, adaptive bitrate, and the DAG model', file: '1403-youtube-transcoding-and-dag.html', ready: false },
    { id: '1404', w: 14, n: '14.4', t: 'The Transcoding Factory', d: 'Preprocessor, DAG scheduler, resource manager, task workers, temporary storage', file: '1404-youtube-transcoding-architecture.html', ready: false },
    { id: '1405', w: 14, n: '14.5', t: 'Faster, Safer, Cheaper', d: 'Speed, safety and cost optimisations, plus the book\'s error-handling playbook', file: '1405-youtube-optimizations-and-errors.html', ready: false },
    { id: '1406', w: 14, n: 'BOSS', t: 'Design YouTube Live', d: 'Full mock interview: design a video upload and streaming service', file: '1406-youtube-boss-design-it-live.html', boss: true, ready: false },
    { id: '1501', w: 15, n: '15.1', t: 'Claim Your Locker', d: 'Scope Google Drive, run the numbers, design the upload/download/revision APIs, outgrow one server', file: '1501-drive-scope-and-apis.html', ready: true },
    { id: '1502', w: 15, n: '15.2', t: 'Chop It Into Blocks', d: 'The high-level design, block servers, 4 MB blocks, delta sync, compress-then-encrypt', file: '1502-drive-blocks-and-delta-sync.html', ready: true },
    { id: '1503', w: 15, n: '15.3', t: 'The Metadata Ledger', d: 'Strong consistency, cache invalidation, the metadata schema, and sync conflicts', file: '1503-drive-metadata-and-conflicts.html', ready: true },
    { id: '1504', w: 15, n: '15.4', t: 'Ping When It Changes', d: 'The upload flow, the download flow, long-polling notifications and the offline backup queue', file: '1504-drive-upload-download-notify.html', ready: true },
    { id: '1505', w: 15, n: '15.5', t: 'Thrift & Chaos', d: 'Save storage space with dedup, version limits and cold storage, then survive every component failing', file: '1505-drive-storage-and-failures.html', ready: true },
    { id: '1506', w: 15, n: 'BOSS', t: 'Design Drive Live', d: 'Full mock interview: design Google Drive with the 4-step framework', file: '1506-drive-boss-design-it-live.html', boss: true, ready: true },
  ];

  const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      d.lessons = d.lessons || {}; d.runs = d.runs || {};
      return d;
    } catch (_) { return { lessons: {}, runs: {} }; }
  }
  function save(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (_) {} }
  function rankOf(xp) {
    let i = 0; RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; });
    const lo = RANKS[i][0], hi = RANKS[i + 1] ? RANKS[i + 1][0] : lo + 1000;
    return { i, name: RANKS[i][1], lo, hi };
  }
  function totalXP(d, exceptId) { return Object.entries(d.lessons).reduce((s, [k, l]) => s + (k === exceptId ? 0 : (l.xp || 0)), 0); }
  function isUnlocked(d, id) {
    const i = CATALOG.findIndex(q => q.id === id);
    return true; // no locks — any quest can be opened in any order
  }

  function burst() {
    if (REDUCED) return;
    const cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv);
    const cx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#5a48f0', '#0d9a96', '#f0b400', '#e5484d', '#43d98a', '#8f82ff'];
    const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 3, s: Math.random() * 6 + 4, c: cols[Math.random() * cols.length | 0], r: Math.random() * 6 }));
    let f = 0;
    (function tick() {
      cx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.r += .1; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); });
      if (++f < 150) requestAnimationFrame(tick); else cv.remove();
    })();
  }

  /**
   * Quest.init(cfg) → Q
   * cfg: {
   *   id: '0002',                        // must match CATALOG
   *   badge: '🛡️ Badge: Ring Master',
   *   winTitle: 'Keyspace sliced',        // victory heading
   *   map: '../reference/quest-map.html', // optional
   *   cheatsheet: '../reference/kv-store-cap-cheatsheet.html' // optional
   * }
   * Then register stage setup with Q.onStage(n, fn) and finally call Q.start().
   */
  function init(cfg) {
    const id = cfg.id;
    const meta = CATALOG.find(q => q.id === id) || { n: '', t: document.title };
    const idx = CATALOG.indexOf(meta);
    const prevQ = idx > 0 ? CATALOG[idx - 1] : null, nextQ = idx >= 0 ? CATALOG[idx + 1] : null;
    const map = cfg.map || '../reference/quest-map.html';
    const stages = $$('.stage[data-stage]').sort((a, b) => a.dataset.stage - b.dataset.stage);
    const N = stages.length;
    const handlers = {}, inited = new Set();
    let d = load();
    let run, review = false, finished = false;

    if (d.runs[id]) run = { cleared: new Set(d.runs[id].cleared || []), xp: d.runs[id].xp || 0, hearts: d.runs[id].hearts ?? 3 };
    else if (d.lessons[id]) { review = true; run = { cleared: new Set(stages.map(s => +s.dataset.stage)), xp: d.lessons[id].xp || 0, hearts: d.lessons[id].stars || 3 }; }
    else run = { cleared: new Set(), xp: 0, hearts: 3 };

    function persist() {
      if (review) return;
      d = load();
      d.runs[id] = { cleared: [...run.cleared], xp: run.xp, hearts: run.hearts };
      save(d);
    }
    const stageOf = el => { const s = el && el.closest && el.closest('.stage[data-stage]'); return s ? +s.dataset.stage : 0; };
    const earns = el => !review && !run.cleared.has(stageOf(el));
    const unlocked = () => true; // no locks — every stage is open from the start
    const current = () => { for (let i = 1; i <= N; i++) if (!run.cleared.has(i)) return i; return N + 1; };

    /* ----- HUD ----- */
    const hud = $('#hud') || (() => { const h = document.createElement('header'); h.className = 'hud'; h.id = 'hud'; document.body.prepend(h); return h; })();
    hud.className = 'hud';
    hud.innerHTML = `<div class="hud-in">
        <a class="back" href="${map}" title="Back to the quest map"><span class="hex">⬡</span><span class="t">Map · ${esc(meta.n)}</span></a>
        <div class="xpwrap"><div class="xpline"><span><b class="q-rank"></b></span><span class="q-xp"></span></div><div class="xpbar"><div class="xpfill"></div></div></div>
        <div class="hearts" aria-label="lives"><span class="heart">♥</span><span class="heart">♥</span><span class="heart">♥</span></div>
      </div>
      <nav class="dots" aria-label="Stages">${stages.map(s => `<button class="dot" data-go="${s.dataset.stage}" title="Stage ${s.dataset.stage}: ${esc(($('h2', s) || {}).textContent || '')}" aria-label="Go to stage ${s.dataset.stage}"></button>`).join('')}</nav>`;
    $$('.dot', hud).forEach(b => b.onclick = () => {
      const n = +b.dataset.go;
      if (!unlocked(n)) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); toast('🔒 locked', b, 'practice'); return; }
      $('#s' + n).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    });

    function renderHUD() {
      const total = totalXP(d, id) + (review && d.lessons[id] ? d.lessons[id].xp : run.xp);
      const r = rankOf(total);
      $('.q-rank', hud).textContent = `Lv ${r.i + 1} · ${r.name}`;
      $('.q-xp', hud).textContent = `${total} / ${r.hi} XP`;
      $('.xpfill', hud).style.width = Math.min(100, ((total - r.lo) / (r.hi - r.lo)) * 100) + '%';
      $$('.heart', hud).forEach((h, k) => h.classList.toggle('lost', k >= run.hearts));
      $('.hearts', hud).setAttribute('aria-label', `${run.hearts} lives left`);
      const cur = current();
      $$('.dot', hud).forEach(dt => {
        const n = +dt.dataset.go;
        dt.className = 'dot' + (run.cleared.has(n) ? ' done' : n === cur ? ' active' : unlocked(n) ? ' open' : ' locked');
      });
    }
    function renderStages() {
      stages.forEach(s => {
        const n = +s.dataset.stage, lock = $('.lock div', s), pill = $('.pill', s);
        s.classList.toggle('cleared', run.cleared.has(n));
        s.classList.toggle('locked', !unlocked(n));
        if (lock) lock.textContent = `🔒 Clear stage ${n - 1} to unlock`;
        if (pill) pill.textContent = run.cleared.has(n) ? (review ? 'Cleared ✓ · practice' : 'Cleared ✓') : 'Not cleared';
      });
    }
    function setupUnlocked() {
      stages.forEach(s => { const n = +s.dataset.stage; if (unlocked(n) && !inited.has(n)) { inited.add(n); if (handlers[n]) { try { handlers[n](); } catch (e) { console.error(e); } } } });
    }

    /* ----- feedback ----- */
    function toast(text, el, kind) {
      const r = (el && el.getBoundingClientRect) ? el.getBoundingClientRect() : $('.xpfill', hud).getBoundingClientRect();
      const t = document.createElement('div');
      t.className = 'toast' + (kind ? ' ' + kind : '');
      t.textContent = text;
      t.style.left = Math.max(8, Math.min(innerWidth - 120, r.left + r.width / 2 - 20)) + 'px';
      t.style.top = Math.max(70, r.top - 6) + 'px';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1200);
    }
    function addXP(n, el) {
      if (!earns(el)) { toast('✓ practice', el, 'practice'); return; }
      run.xp += n; toast(`+${n} XP`, el); persist(); renderHUD();
    }
    function loseHeart(el) {
      if (!earns(el)) { toast('✗ practice', el, 'practice'); return; }
      if (run.hearts > 0) { run.hearts--; const h = $$('.heart', hud)[run.hearts]; h.classList.add('pop'); setTimeout(() => h.classList.remove('pop'), 600); }
      toast('−1 ♥', el, 'minus'); persist(); renderHUD();
    }
    function clearStage(n) {
      if (run.cleared.has(n)) { if (run.cleared.size === N) showVictory(false); return; }
      run.cleared.add(n); persist();
      renderStages(); renderHUD(); setupUnlocked();
      if (run.cleared.size === N) { finish(); return; }
      // no locks, so stages can be cleared in any order: go to the next unfinished one (after n first, then wrap)
      const order = stages.map(s => +s.dataset.stage), todo = order.filter(k => !run.cleared.has(k));
      const nextN = todo.find(k => k > n) || todo[0];
      const next = nextN && $('#s' + nextN);
      if (next) setTimeout(() => next.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }), 650);
    }

    /* ----- victory ----- */
    function finish() {
      if (finished) return; finished = true;
      const stars = Math.max(1, run.hearts);
      d = load();
      const prev = d.lessons[id] || { xp: 0, stars: 0 };
      d.lessons[id] = { xp: Math.max(prev.xp || 0, run.xp), stars: Math.max(prev.stars || 0, stars), at: new Date().toISOString() };
      delete d.runs[id];
      save(d);
      review = true;
      renderStages(); renderHUD(); renderNav();
      showVictory(true, { xp: run.xp, stars, hearts: run.hearts });
      burst();
    }
    function showVictory(scroll, res) {
      const v = $('#victory'); if (!v) return;
      const best = d.lessons[id] || { xp: run.xp, stars: Math.max(1, run.hearts) };
      res = res || { xp: best.xp, stars: best.stars, hearts: best.stars, isBest: true };
      const nextHref = nextQ && nextQ.file ? nextQ.file : null;
      v.innerHTML = `<div class="kicker">${res.isBest ? 'Best run' : 'Quest complete'}</div>
        <h2>${esc(cfg.winTitle || 'Quest cleared')} 🏆</h2>
        <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= res.stars ? '' : 'off'}">★</span>`).join('')}</div>
        <div class="vstats"><div><b>${res.xp}</b><span>XP earned</span></div><div><b>${res.hearts}</b><span>Hearts left</span></div><div><b>${rankOf(totalXP(d)).name}</b><span>Rank</span></div></div>
        <div class="badge-earned">${esc(cfg.badge || '🏅 Quest badge')}</div>
        <div class="row">
          <a class="btn" href="${map}">🗺️ Quest map</a>
          ${cfg.cheatsheet ? `<a class="btn" href="${cfg.cheatsheet}">📄 Cheat sheet</a>` : ''}
          <button class="btn q-fresh">↻ Start fresh${res.stars < 3 ? ' for 3★' : ''}</button>
          ${nextHref ? `<a class="btn next" href="${nextHref}">Next: ${esc(nextQ.n)} ${esc(nextQ.t)} →</a>` : ''}
        </div>`;
      $('.q-fresh', v).onclick = startFresh;
      v.classList.add('show');
      if (scroll) setTimeout(() => v.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }), 400);
    }
    function startFresh() {
      if (!confirm('Start this quest over? Your best score is kept.')) return;
      d = load(); d.runs[id] = { cleared: [], xp: 0, hearts: 3 }; save(d);
      location.hash = ''; location.reload();
    }

    /* ----- banner + prev/next nav ----- */
    function renderBanner(kind) {
      const hero = $('.hero'); if (!hero) return;
      const b = document.createElement('div');
      if (kind === 'review') {
        const best = d.lessons[id];
        b.className = 'banner';
        b.innerHTML = `<span>✅</span><span class="grow"><b>You've cleared this quest</b> (${'★'.repeat(best.stars || 1)}, ${best.xp} XP). Every stage is open — replay any of them as practice. Tap the bars at the top to jump.</span><button class="btn q-fresh">↻ Start fresh</button>`;
        $('.q-fresh', b).onclick = startFresh;
      } else {
        b.className = 'banner resume';
        b.innerHTML = `<span>👋</span><span class="grow"><b>Welcome back.</b> Stages ${[...run.cleared].sort((a, b) => a - b).join(', ')} are cleared — picking up at stage ${current()}.</span><button class="btn q-jump">Jump to stage ${current()} ↓</button>`;
        $('.q-jump', b).onclick = () => $('#s' + current()).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      }
      hero.appendChild(b);
    }
    function renderNav() {
      let nav = $('#lesson-nav');
      if (!nav) { const foot = $('.foot') || $('main'); nav = document.createElement('nav'); nav.id = 'lesson-nav'; nav.className = 'lesson-nav'; foot.prepend(nav); }
      nav.innerHTML = (prevQ ? `<a class="pv" href="${prevQ.file}"><small>← Previous</small>${esc(prevQ.n)} · ${esc(prevQ.t)}</a>` : `<a class="pv" href="${map}"><small>← Back</small>Quest map</a>`) +
        (nextQ ? `<a class="nx" href="${nextQ.file}"><small>Next →</small>${esc(nextQ.n)} · ${esc(nextQ.t)}</a>` : '');
    }

    /* ----- widgets ----- */
    // One-shot multiple choice. Options are shuffled. Keep them the same length (no clues).
    function quiz(mount, { tag = 'Check', q, options, correct, good, bad, xp = 20, onDone }) {
      const box = document.createElement('div');
      box.className = 'quiz';
      box.innerHTML = `<span class="tag">${tag}</span><p class="q">${q}</p><div class="opts"></div><div class="explain"></div>`;
      const opts = $('.opts', box), ex = $('.explain', box);
      shuffle(options.map((o, i) => ({ o, i }))).forEach(({ o, i }) => {
        const b = document.createElement('button');
        b.className = 'opt'; b.textContent = o; b.dataset.i = i;
        b.onclick = () => {
          $$('.opt', opts).forEach(x => x.disabled = true);
          const ok = i === correct;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) $(`.opt[data-i="${correct}"]`, opts).classList.add('right');
          ex.className = 'explain show ' + (ok ? 'good' : 'bad');
          ex.innerHTML = (ok ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + (ok ? good : (bad || good));
          ok ? addXP(xp, b) : loseHeart(b);
          onDone && onDone(ok);
        };
        opts.appendChild(b);
      });
      mount.appendChild(box);
      return box;
    }

    // Boss round: a sequence of scenario cards, each answered by picking one of `choices`.
    // scenarios: [{ e:'🏦', t:'Title', d:'detail', a:'CP', why:'html' }]
    // choices:   [{ k:'CP', label:'CP', sub:'refuse when unsure' }, ...]  (2–4)
    // A scenario may carry its own `choices` array to override the shared one.
    function boss(mount, { name = '👾 Boss', scenarios, choices, xp = 20, outro, onDone }) {
      let bi = 0, wins = 0;
      mount.innerHTML = `<div class="boss-top"><b>${name}</b><div class="bosshp"><div></div></div><span class="mono small q-count"></span></div><div class="q-arena"></div>`;
      const hp = $('.bosshp div', mount), count = $('.q-count', mount), arena = $('.q-arena', mount);
      function show() {
        const s = scenarios[bi], cs = s.choices || choices;
        count.textContent = `${bi + 1} / ${scenarios.length}`;
        hp.style.width = (100 - (bi / scenarios.length) * 100) + '%';
        arena.innerHTML = `<div class="scenario"><div class="emoji">${s.e || '❓'}</div><h3>${s.t}</h3>${s.d ? `<p>${s.d}</p>` : ''}</div>
          <div class="choice" style="--n:${cs.length}">${cs.map(c => `<button class="opt" data-c="${esc(c.k)}"><b>${c.label}</b>${c.sub ? `<span>${c.sub}</span>` : ''}</button>`).join('')}</div>
          <div class="explain"></div><div class="row" style="margin-top:12px"></div>`;
        $$('.choice .opt', arena).forEach(b => b.onclick = () => {
          $$('.choice .opt', arena).forEach(x => x.disabled = true);
          const ok = b.dataset.c === s.a;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) $(`.choice .opt[data-c="${s.a}"]`, arena).classList.add('right');
          const ex = $('.explain', arena); ex.className = 'explain show ' + (ok ? 'good' : 'bad');
          const lab = (cs.find(c => c.k === s.a) || {}).label || s.a;
          ex.innerHTML = `<b>${lab}.</b> ${s.why}`;
          if (ok) { addXP(xp, b); wins++; } else loseHeart(b);
          hp.style.width = (100 - ((bi + 1) / scenarios.length) * 100) + '%';
          const nx = document.createElement('button'); nx.className = 'btn primary';
          nx.textContent = bi < scenarios.length - 1 ? 'Next →' : '⚔️ Final blow';
          nx.onclick = () => {
            bi++;
            if (bi < scenarios.length) return show();
            arena.innerHTML = `<div class="scenario"><div class="emoji">💥</div><h3>Boss defeated</h3><p>${wins} of ${scenarios.length} called correctly.${outro ? ' ' + outro : ''}</p></div>`;
            burst(); onDone && onDone(wins);
          };
          $('.row', arena).appendChild(nx);
        });
      }
      show();
    }

    // "Say it like a senior": free recall, then compare with a model answer and self-grade.
    function drill(mount, { prompt, placeholder = 'Start typing…', model, checks, minWords = 12, onDone }) {
      mount.innerHTML = `<p>${prompt}</p><p class="small muted">Write it from memory. No scrolling up — that's the point.</p>
        <textarea placeholder="${esc(placeholder)}"></textarea>
        <div class="row" style="margin-top:10px"><button class="btn primary q-reveal" disabled>Compare with a model answer</button></div>
        <div class="model"><b>Model answer.</b> ${model}</div>
        <div class="selfgrade"><p class="small"><b>Grade yourself honestly</b> — tick what your answer actually said:</p>
          ${checks.map(c => `<label><input type="checkbox"> <span>${c}</span></label>`).join('')}
          <div class="row" style="margin-top:8px"><button class="btn primary q-finish">Lock it in</button></div></div>`;
      const ta = $('textarea', mount), rv = $('.q-reveal', mount);
      ta.addEventListener('input', () => { rv.disabled = ta.value.trim().split(/\s+/).length < minWords; });
      rv.onclick = () => { rv.disabled = true; ta.readOnly = true; $('.model', mount).classList.add('show'); $('.selfgrade', mount).classList.add('show'); addXP(10, rv); };
      $('.q-finish', mount).onclick = e => {
        const boxes = $$('.selfgrade input', mount), n = boxes.filter(x => x.checked).length;
        if (n) addXP(n * 10, e.currentTarget);
        e.currentTarget.disabled = true; boxes.forEach(x => x.disabled = true);
        onDone && onDone(n);
      };
    }

    const Q = {
      onStage(n, fn) { handlers[n] = fn; if (started && unlocked(n) && !inited.has(n)) { inited.add(n); fn(); } return Q; },
      start() {
        started = true;
        renderStages(); renderHUD(); renderNav(); setupUnlocked();
        if (review) { renderBanner('review'); showVictory(false); }
        else if (run.cleared.size) renderBanner('resume');
        return Q;
      },
      addXP, loseHeart, clearStage, toast, quiz, boss, drill, burst, shuffle, sleep, esc,
      isCleared: n => run.cleared.has(n),
      cleared: () => [...run.cleared].sort((a, b) => a - b),
      get review() { return review; },
      reduced: REDUCED,
    };
    let started = false;
    return Q;
  }

  window.Quest = { init, load, save, rankOf, totalXP, isUnlocked, RANKS, CATALOG, WORLDS, STORE_KEY, REDUCED };
})();
