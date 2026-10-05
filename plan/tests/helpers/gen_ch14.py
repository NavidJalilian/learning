import json

BOOK = {"label": "System Design Interview Vol. 1, Ch. 14: Design YouTube (ByteByteGo)", "url": "https://bytebytego.com/courses/system-design-interview/design-youtube"}
CF = {"label": "Amazon CloudFront pricing (the book's $0.02/GB figure)", "url": "https://aws.amazon.com/cloudfront/pricing/"}
SVE = {"label": "Huang et al., SVE: Distributed Video Processing at Facebook Scale (SOSP 2017), the source of the DAG model", "url": "https://www.cs.princeton.edu/~wlloyd/papers/sve-sosp17.pdf"}
SAS = {"label": "Microsoft: Delegate access with a shared access signature", "url": "https://learn.microsoft.com/en-us/rest/api/storageservices/delegate-access-with-shared-access-signature"}
S3PRE = {"label": "AWS: Uploading objects with presigned URLs", "url": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html"}
S3MPU = {"label": "AWS: Uploading and copying objects using multipart upload", "url": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html"}
YTRES = {"label": "YouTube Data API: resumable uploads", "url": "https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol"}
HLS = {"label": "RFC 8216: HTTP Live Streaming", "url": "https://datatracker.ietf.org/doc/html/rfc8216"}
ABR = {"label": "Wikipedia: Adaptive bitrate streaming", "url": "https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming"}
GOP = {"label": "Wikipedia: Group of pictures", "url": "https://en.wikipedia.org/wiki/Group_of_pictures"}
BLOB = {"label": "Wikipedia: Binary large object", "url": "https://en.wikipedia.org/wiki/Binary_large_object"}
OC = {"label": "Netflix Open Connect (Netflix's own CDN, placed inside ISPs)", "url": "https://openconnect.netflix.com/"}
LONGTAIL = {"label": "Cheng, Dale, Liu: Understanding the Characteristics of Internet Short Video Sharing: A YouTube-based Measurement Study", "url": "https://arxiv.org/abs/0707.3670"}
PERTITLE = {"label": "Netflix Tech Blog: Per-Title Encode Optimization", "url": "https://netflixtechblog.com/per-title-encode-optimization-7e99442b62a2"}
WIDEVINE = {"label": "Google Widevine DRM", "url": "https://www.widevine.com/"}
FAIRPLAY = {"label": "Apple FairPlay Streaming", "url": "https://developer.apple.com/streaming/fps/"}
CONTENTID = {"label": "YouTube Help: How Content ID works", "url": "https://support.google.com/youtube/answer/2797370"}

quests = []

# ---------------------------------------------------------------- 14.1
quests.append({
  "n": "14.1",
  "slug": "youtube-scope-and-estimate",
  "t": "Size Up the Tube",
  "d": "Scope a YouTube clone and do the napkin maths for storage and CDN cost",
  "boss": False,
  "badge": "📏 Badge: Napkin Mathematician",
  "winTitle": "Scope locked, numbers on the napkin",
  "goal": "Your win today: you can turn 'design YouTube' into a scoped problem (upload + watch, 5M DAU, videos up to 1 GB, encryption, cloud allowed) and say out loud why storage is ~150 TB/day and the CDN bill ~$150,000/day.",
  "bookSections": "Intro (YouTube by the numbers); Step 1: understand the problem and establish design scope; Back-of-the-envelope estimation",
  "stages": [
    {
      "title": "Guess the giant",
      "sub": "How big is YouTube, really?",
      "teaches": "The book opens with YouTube's scale (figures from about 2019-2020): 2 billion monthly active users; 5 billion videos watched per day; 73% of US adults use YouTube; 50 million creators; $15.1 billion ad revenue in 2019; 37% of all mobile internet traffic; available in 80 languages. The point: 'YouTube' is far too big to design in 45 minutes, so the interview narrows it to two core features: UPLOAD a video and WATCH a video. Everything else (comments, likes, recommendations, search, monetisation) is out of scope unless the interviewer pulls it in.",
      "interaction": "'Guess the giant' cards. Seven stat cards appear one at a time, each with a log-scale slider (e.g. MAU from 1 million to 10 billion, daily views from 10 million to 100 billion, share of mobile traffic 0-100%). The learner drags to a guess and taps Lock; the true book figure is revealed with a bar showing how far off they were. Within 2x (or within 10 percentage points for % stats) = +XP; way off = no penalty, just a shake. After the last card a banner shows: 'Too big to design whole. The book picks 2 features: ___ and ___' with two blanks the learner fills from chips (upload, watch, comments, search, recommendations, live chat).",
      "check": "Q.quiz (2 Qs): (1) Which two features does the book's design cover? -> uploading and watching videos. (2) Why narrow the scope at all? -> 45 minutes is only enough to design a couple of core flows well; a senior candidate agrees scope with the interviewer before drawing anything."
    },
    {
      "title": "Interrogate the interviewer",
      "sub": "Step 1: ask the questions that change the design",
      "teaches": "The book's Q&A, verbatim in spirit: features -> upload and watch; clients -> mobile apps, web browsers and smart TVs; daily active users -> 5 million; average time per day -> 30 minutes; international users -> yes, a large share; resolutions -> accept most video resolutions and formats; encryption -> required; file size -> focus on small and medium videos, max 1 GB; can we use existing cloud services (Amazon, Google, Microsoft)? -> yes, building everything (blob storage, CDN) from scratch is unrealistic, so pick the right existing tech. Resulting requirements: fast uploads; smooth streaming; ability to change video quality; low infrastructure cost; high availability, scalability and reliability; support for mobile, web and smart TV.",
      "interaction": "Requirements board (same pattern as lesson 0008 stage 1). A grid of 14 question chips: the 9 book questions above plus 5 distractors ('Which programming language?', 'What colour is the play button?', 'Which database vendor?', 'How should comments be threaded?', 'Should we use microservices?'). Tapping a good question shows the interviewer's answer in a speech bubble and pins a requirement card to the board (e.g. '5M DAU', 'max 1 GB', 'encryption: yes', 'cloud: allowed'). A distractor costs 1 game-minute and the interviewer frowns ('We can decide that later'). When all 9 are found, the board auto-assembles the six non-functional requirements as a summary card.",
      "check": "Q.quiz (2 Qs): (1) Why does 'can we use existing cloud services?' matter? -> it lets you rely on managed blob storage and a CDN instead of designing them, so you spend time on what's unique (transcoding pipeline, flows). (2) What does the 1 GB max file size change? -> it bounds upload time and transcoding work per video, and lets you size chunks and retries."
    },
    {
      "title": "Napkin maths: storage",
      "sub": "Calculate, then check",
      "teaches": "Book assumptions: 5 million DAU; each user watches 5 videos/day; 10% of users upload 1 video/day; average video size 300 MB. Daily storage for new videos = 5,000,000 x 10% x 300 MB = 500,000 uploads x 300 MB = 150 TB per day. That is ~55 PB per year of originals alone. Back-of-the-envelope = rough maths to find the order of magnitude and the dominant cost, not an exact figure.",
      "interaction": "Calculate-and-check. Step A: the learner types 'uploads per day' (accept 500,000, also '500k'). Step B: types 'storage per day' with a unit dropdown (GB/TB/PB); accept 140-160 TB. Wrong answers reveal one hint step at a time (multiply DAU by 10%; multiply by 300 MB; 1 TB = 1,000,000 MB). Step C, 'make it real' panel: three sliders the book ignores: number of transcoded renditions stored (1-6, default 1), replication factor (1-3), years kept (1-5). A big counter shows total storage live (e.g. 150 TB x 5 renditions x 3 copies x 365 days = ~820 PB/year). The learner is asked to predict first whether adding 5 renditions roughly doubles or roughly multiplies by 5 the total, then the counter animates.",
      "check": "Inline check passes when A and B are correct; the 'make it real' panel ends with one Q.quiz question: 'The book says 150 TB/day. Which of these is NOT included in that number?' -> transcoded copies and replicas (it counts originals only)."
    },
    {
      "title": "Napkin maths: the CDN bill",
      "sub": "Find the cost that dominates",
      "teaches": "CDN = content delivery network: servers spread around the world that cache and serve content from close to the viewer. Book's estimate, using Amazon CloudFront at $0.02 per GB in the US: 5 million users x 5 videos x 0.3 GB x $0.02 = $150,000 per day (about $55 million a year). Lesson: serving bytes from the CDN is the dominant cost, which is why the deep dive later spends a whole section on cost-saving (only the popular videos on the CDN, etc.).",
      "interaction": "Calculate-and-check, then a cost explorer. The learner types the daily CDN cost; accept $140k-$160k. Then a 'bill meter' shows $/day and $/year with sliders: price per GB ($0.02 book value up to $0.085, roughly CloudFront's first-tier US list price), videos watched per user per day (1-10), share of each video actually watched (20%-100%, default 100% as the book assumes), and DAU (1M-50M). Predict-then-watch prompt before moving the price slider: 'If price goes from $0.02 to $0.085, the bill becomes about: 2x / 4x / 10x?' (answer ~4x, ~$640k/day).",
      "check": "Q.quiz (2 Qs): (1) Which single line item dominates this design's running cost? -> CDN egress (serving video bytes). (2) Which assumption makes the book's estimate pessimistic? -> it assumes every view streams the full 300 MB file; in reality many viewers stop early and many watch at lower quality."
    },
    {
      "title": "Boss: The Scope Creep",
      "sub": "Keep the interview on the rails",
      "teaches": "Applying Step 1 under pressure: clarify before designing, write assumptions down, use the numbers to motivate the design (CDN cost -> cost optimisations; 1 GB uploads -> chunked, resumable upload).",
      "interaction": "Q.boss() with 5 scenario cards, 3 choices each. (1) Interviewer: 'Design YouTube.' You: start drawing load balancers / ask which features and scale matter / list every YouTube feature -> ask. (2) 'How much storage per day?' Choices: DAU x 5 videos x 300 MB / DAU x 10% x 300 MB / DAU x 300 MB -> DAU x 10% x 300 MB (uploads, not views, create storage). (3) 'Should we build our own blob storage?' -> no, use managed cloud storage (S3/GCS/Azure Blob); explain the trade-off (control vs time-to-market and cost of building). (4) 'Do we have to support 4K and old phones?' -> yes, 'most resolutions and formats', so you need transcoding into many versions. (5) Spot the bug: a candidate says CDN cost = 5M x 10% x 0.3 GB x $0.02 = $3,000/day -> wrong, uses uploads instead of views; views x size x price = $150k/day.",
      "check": "Boss passes at 4/5; wrong answers cost a heart and show a one-line why."
    },
    {
      "title": "Say it like a senior",
      "sub": "The 60-second scope",
      "teaches": "Recall, not re-reading.",
      "interaction": "Q.drill(): prompt 'In about 60 seconds, scope YouTube for the interviewer: features, clients, scale, constraints, and your two headline numbers and what they imply.' Free-text box, then reveal a model answer and a self-grade checklist: mentions upload + watch only; mobile/web/smart TV; 5M DAU, 30 min/day, international; max 1 GB; encryption; managed cloud allowed; 150 TB/day new storage (originals only); ~$150k/day CDN -> cost is the CDN, so optimise it later.",
      "check": "Self-grade: got it / partly / missed it per checklist line (engine standard)."
    }
  ],
  "caveats": [
    "The opening stats (2B MAU, 5B views/day, $15.1B ad revenue) are from around 2019-2020 and are quoted from third-party stat roundups; treat them as 'order of magnitude', not current facts.",
    "5 million DAU is tiny compared with real YouTube. It is an interview simplification so the maths stays on a napkin.",
    "150 TB/day counts original uploads only. Real storage multiplies by the number of transcoded renditions (often 5+) and by replication (often 3 copies), so the real figure is many times larger.",
    "$0.02/GB is CloudFront's lowest published US tier, which only applies at very high monthly volume; first-tier list prices are several times higher, and big customers negotiate private rates. The estimate also assumes every view downloads the full 300 MB file."
  ],
  "sources": [BOOK, CF, BLOB]
})

# ---------------------------------------------------------------- 14.2
quests.append({
  "n": "14.2",
  "slug": "youtube-upload-and-stream-flows",
  "t": "Upload Lane, Watch Lane",
  "d": "The high-level design: CDN, API servers, the video upload flow and the streaming flow",
  "boss": False,
  "badge": "🛣️ Badge: Pipeline Pilot",
  "winTitle": "Both lanes are open",
  "goal": "Your win today: you can draw the book's high-level design and walk an interviewer through what happens, step by numbered step, from 'upload' to 'ready to stream', and explain how a video then streams from the nearest CDN edge.",
  "bookSections": "Step 2: propose high-level design and get buy-in (Client, CDN, API servers); Video uploading flow (flow a: upload the actual video; flow b: update the metadata); Video streaming flow (streaming protocols)",
  "stages": [
    {
      "title": "Three boxes",
      "sub": "Who serves what?",
      "teaches": "The book's top-level split: Client (computer, mobile phone, smart TV); CDN, which stores the videos and streams them from the edge server closest to the user; API servers, which handle everything except streaming: feed recommendations, generating the video upload URL, updating the metadata database and cache, user signup, and so on. Blob storage = 'binary large object' storage: a service that stores big unstructured files (like video) cheaply and durably (e.g. Amazon S3). Design principle from the book: don't build everything; reuse existing cloud services (blob storage, CDN) and spend the interview on the parts that matter.",
      "interaction": "Sort into lanes. 8 request cards fall in one at a time: 'play the next 4 seconds of a video', 'sign up', 'get my home feed', 'get an upload URL', 'save video title and description', 'fetch the 720p version', 'like a video', 'load thumbnail image'. The learner flicks each into the CDN lane or the API servers lane. Thumbnail is accepted in CDN (static asset) with a note that the book doesn't say. A wrong drop bounces back with a one-line reason.",
      "check": "Q.quiz (2 Qs): (1) Why stream from a CDN rather than from your API servers? -> the edge is close to the viewer (low latency, high throughput) and it takes the huge bandwidth load off your servers. (2) What is blob storage good for? -> large binary files such as raw and transcoded videos."
    },
    {
      "title": "Build the upload pipeline",
      "sub": "Put the components on the whiteboard",
      "teaches": "Components of the book's upload design and what each does: User (client); Load balancer (spreads requests across API servers); API servers (all non-streaming requests); Metadata DB (video metadata such as title, URL, size, resolution, format, user info; sharded and replicated for performance and availability); Metadata cache (caches metadata and user objects for speed); Original storage (blob storage for the uploaded original videos); Transcoding servers (convert the video into multiple formats/resolutions; 'transcoding' = 'encoding' here); Transcoded storage (blob storage for the transcoded output); CDN (caches and streams the transcoded videos); Completion queue (a message queue holding 'transcoding finished' events); Completion handler (a set of workers that pull events from the completion queue and update the metadata DB and cache).",
      "interaction": "Whiteboard builder (like 0008 stage 2). An empty canvas with the user on the left. 11 component chips sit in a tray. The learner taps components in an order that respects dependencies and each snaps into its place in the book's diagram with an arrow; hovering shows a one-line definition. Placing something whose input doesn't exist yet (e.g. completion handler before completion queue, CDN before transcoded storage) shakes and costs 1 XP. Two decoy chips ('video editing service', 'search index') cost a heart if placed. Finished diagram stays visible for the next stage.",
      "check": "Q.quiz (2 Qs): (1) Why put a completion queue between the transcoding servers and the database? -> it decouples them: transcoders publish 'done' events and move on; the completion handler updates the DB at its own pace and can retry. (2) Why is the metadata DB sharded and replicated? -> sharding for write/read scale, replication for availability and read throughput."
    },
    {
      "title": "Follow the bytes",
      "sub": "Predict each hop of the upload, then watch it",
      "teaches": "Flow a (upload the actual video), the book's numbered steps: 1. Videos are uploaded to original storage. 2. Transcoding servers fetch videos from original storage and start transcoding. 3. Once transcoding is complete, two things happen in parallel: 3a. transcoded videos are sent to transcoded storage, and 3a.1. distributed to the CDN; 3b. transcoding completion events are queued in the completion queue, 3b.1. the completion handler's workers pull the events, 3b.1.a and 3b.1.b. the completion handler updates the metadata DB and the metadata cache. 4. API servers inform the client that the video is uploaded and ready for streaming. Flow b (update the metadata): while the file is uploading, the client in parallel sends a request to update the video metadata (file name, size, format, etc.); API servers update the metadata cache and DB.",
      "interaction": "Predict-then-watch on the diagram from stage 2. A glowing 'video packet' travels along the arrows. At each numbered junction the animation pauses and offers 3 'next hop' choices; correct = the packet continues and the step label (1, 2, 3a, 3a.1, 3b...) lights up. At step 3 the packet splits into two packets (3a and 3b) to show parallelism; the learner must tap BOTH branches to proceed. After flow a finishes, a second, smaller 'metadata packet' runs flow b and the learner is asked: 'Does flow b wait for flow a to finish?' (No: it runs in parallel while the file uploads). A 'replay at 2x' button shows both flows together.",
      "check": "Q.quiz (2 Qs): (1) Put in order: completion handler updates DB, transcoding servers fetch original, CDN gets transcoded copy, upload to original storage. (2) Why send metadata in parallel with the upload? -> the user can type the title while the big file uploads; metadata is tiny and doesn't need to wait for bytes."
    },
    {
      "title": "Stream, don't download",
      "sub": "How the video reaches the screen",
      "teaches": "Downloading = copy the whole file before playing. Streaming = the device continuously receives small pieces of the video from a remote source and plays them as they arrive, so playback starts almost immediately. Streaming protocol = a standardised way to control data transfer for streaming. The book lists: MPEG-DASH (MPEG = Moving Picture Experts Group; DASH = Dynamic Adaptive Streaming over HTTP), Apple HLS (HTTP Live Streaming), Microsoft Smooth Streaming, Adobe HTTP Dynamic Streaming (HDS). You don't need to know the internals; you need to know different protocols support different video encodings and players, so pick the right one for your use case. Videos stream directly from the CDN: the edge server closest to you delivers the video, so latency is very low.",
      "interaction": "Race simulation. Two phones side by side play the same 300 MB clip on a 20 Mbit/s connection. Before pressing Play, the learner predicts the time-to-first-frame for each (choices: ~0.5 s / ~15 s / ~2 min). Left 'Download' phone shows a progress bar filling for about 2 minutes (300 MB = 2,400 Mbit / 20 Mbit/s = 120 s) before playing; right 'Stream' phone fetches 4-second segments and starts in under a second. Then an 'edge picker' map: the learner taps their city; arrows show the request going to the nearest CDN edge (low RTT) vs a far origin (high RTT), with ms counters. Finish with a 4-card match: acronym -> full name (DASH, HLS, Smooth Streaming, HDS).",
      "check": "Q.quiz (2 Qs): (1) Where do viewers' video bytes come from in the book's design? -> the nearest CDN edge server, not the API servers or original storage. (2) Why do protocol choices matter? -> each supports different encodings and players; you choose based on the devices you must support."
    },
    {
      "title": "Boss: The Upload Ogre",
      "sub": "Debug the flows",
      "teaches": "Reasoning across the whole flow: which component owns which state, what runs in parallel, where to look when something is stuck.",
      "interaction": "Q.boss() with 5 cards, 3 choices each. (1) 'The transcoded files are on the CDN but the app still shows Processing forever.' -> look at the completion queue / completion handler (step 3b never updated the metadata DB/cache). (2) 'A smart TV in Brazil wants to play a video. Which box serves the bytes?' -> nearest CDN edge. (3) 'Should transcoding servers write directly to the metadata DB instead of the queue?' -> no: tight coupling; the queue absorbs bursts and lets the handler retry. (4) 'The user edits the title while the 1 GB file is still uploading. Problem?' -> no, flow b runs independently through the API servers. (5) 'Why not stream from original storage to save CDN money?' -> originals aren't transcoded for devices or bandwidth, and storage is far from viewers (high latency).",
      "check": "Pass at 4/5."
    },
    {
      "title": "Say it like a senior",
      "sub": "'Walk me through an upload'",
      "teaches": "Recall of both flows.",
      "interaction": "Q.drill(): prompt 'The interviewer says: walk me through what happens from the moment I hit Upload until my friend presses Play.' Model answer + checklist: client uploads to original storage; metadata update in parallel via API servers (cache + DB); transcoding servers fetch and transcode; in parallel transcoded copies go to transcoded storage then CDN, and a completion event goes to the completion queue; completion handler updates metadata DB and cache; API servers tell the client it's ready; the friend streams from the nearest CDN edge using a streaming protocol such as HLS or DASH.",
      "check": "Self-grade per checklist line."
    }
  ],
  "caveats": [
    "The book's step 4 says API servers 'inform the client'. In practice that is a push notification or the client polling a status endpoint; the book doesn't specify.",
    "Real YouTube publishes lower resolutions first and adds HD/4K later, because higher resolutions take longer to process. The book's flow treats 'transcoding complete' as one event.",
    "Message queues usually deliver at least once, so the completion handler may see the same event twice. Its DB/cache updates should be idempotent (safe to apply twice).",
    "Of the four protocols the book lists, HLS and MPEG-DASH dominate today; Microsoft Smooth Streaming and Adobe HDS are largely legacy."
  ],
  "sources": [BOOK, BLOB, HLS, ABR]
})

# ---------------------------------------------------------------- 14.3
quests.append({
  "n": "14.3",
  "slug": "youtube-transcoding-and-dag",
  "t": "The Format Forge",
  "d": "Why videos are transcoded, containers vs codecs, adaptive bitrate, and the DAG model",
  "boss": False,
  "badge": "🔥 Badge: Format Forger",
  "winTitle": "One upload, every screen",
  "goal": "Your win today: you can give the four reasons to transcode, separate a container from a codec, explain how a player switches quality mid-video, and sketch the DAG that turns one upload into many outputs.",
  "bookSections": "Step 3 deep dive: Video transcoding (why transcode; encoding formats: container and codecs); Directed acyclic graph (DAG) model",
  "stages": [
    {
      "title": "Why transcode?",
      "sub": "Four reasons, one calculator",
      "teaches": "Transcoding (video encoding) = converting a video into other formats (codec, resolution, bitrate) so it plays well on many devices and networks. The book's four reasons: (1) raw video eats storage: an hour-long HD video recorded at 60 frames per second can take up a few hundred GB; (2) many devices and browsers only support certain formats, so you need several for compatibility; (3) deliver higher resolution to users with high bandwidth and lower resolution to users with low bandwidth, so everyone gets smooth playback; (4) network conditions change, especially on mobile, so switching quality automatically or manually based on the network gives a smooth experience. Bitrate = how many bits per second the video uses; higher bitrate = more detail and more bandwidth.",
      "interaction": "Size calculator. Sliders: resolution (480p / 720p / 1080p / 4K), frames per second (24/30/60), duration (1-120 min). Three bars update live: 'truly uncompressed' (width x height x 3 bytes x fps x seconds; 1080p60 for 60 min is about 1.3 TB), 'camera/pro master' (the book's 'few hundred GB' band), and 'streaming encode' at a typical bitrate (e.g. 1080p about 5 Mbit/s -> about 2-3 GB/hour). Before moving the 4K slider, the learner predicts how many times bigger 4K uncompressed is than 1080p (answer: 4x pixels). Then a 4-reason card shuffle: drag 'storage / compatibility / bandwidth / changing network' to match four short user stories (old smart TV; rural user on 3G; train going into a tunnel; storage bill).",
      "check": "Q.quiz (2 Qs): (1) Which reason is about the SAME user at different moments? -> changing network conditions (e.g. mobile). (2) Why not store just one 4K file? -> many devices can't play it and many networks can't carry it; you'd stall or fail."
    },
    {
      "title": "Box vs language",
      "sub": "Containers and codecs",
      "teaches": "Encoding formats have two parts. Container = the 'basket' holding the video stream, audio stream and metadata; recognised by the file extension: .avi, .mov, .mp4. Codec = compression/decompression algorithm that shrinks the video while keeping quality; the book lists H.264, VP9 and HEVC (newer: AV1). Analogy: the container is the box, the codec is the language the contents are written in. The same .mp4 box can hold H.264 or HEVC video; a device needs to understand both the box and the language to play it.",
      "interaction": "Sort conveyor. 9 tiles roll by: .mp4, .mov, .avi, H.264, VP9, HEVC, AV1, 'audio track', 'subtitles/metadata'. The learner flicks each into 'Container (box)' or 'Codec (language)' bins; the last two go inside an open box graphic labelled 'what a container holds'. Then a 'Will it play?' mini-round: 3 device cards (e.g. 'old smart TV: knows MP4 + H.264 only') vs 3 files ('movie.mp4 / HEVC', 'movie.mp4 / H.264', 'movie.webm / VP9'); learner taps which file each device can play.",
      "check": "Q.quiz (2 Qs): (1) Is .mp4 a codec? -> no, a container. (2) Two files are both .mp4 but one won't play on an old TV. Likely why? -> different codec inside (e.g. HEVC vs H.264)."
    },
    {
      "title": "Ride the bitrate ladder",
      "sub": "Predict the stall, then drive the player",
      "teaches": "Adaptive bitrate streaming (ABR): the server stores the video at several quality levels (a 'bitrate ladder', e.g. 360p, 480p, 720p, 1080p, 4K), each cut into short segments of a few seconds, plus a manifest file listing them (.m3u8 for HLS, .mpd for DASH). The player measures its download speed and buffer, and picks the quality of each next segment. This is how 'ability to change video quality' and 'smooth streaming' are achieved, and it is why transcoding into many resolutions is required. Buffer = seconds of video already downloaded but not yet played; empty buffer = stall (spinner).",
      "interaction": "Simulation with a 60-second train ride: a bandwidth graph scrolls (starts at 8 Mbit/s, drops to 0.8 Mbit/s in a tunnel at 20-35 s, recovers). Ladder: 360p 0.7, 480p 1.2, 720p 2.5, 1080p 5, 4K 15 Mbit/s. Round 1 predict-then-watch: 'Fixed 1080p: will it stall? when?' then watch the buffer bar drain in the tunnel and a spinner appear. Round 2: 'Auto (ABR)': watch the player step down to 360p in the tunnel and back up after; no stall. Round 3 'You are the player': every 4-second segment the learner picks a rung; score = quality points minus 10 per stall second. Target score is shown; beating it gives bonus XP.",
      "check": "Q.quiz (2 Qs): (1) What file tells the player which qualities exist? -> the manifest (playlist). (2) In the tunnel, what does a good player do? -> drop to a lower bitrate for the next segments to keep the buffer from emptying."
    },
    {
      "title": "Wire the DAG",
      "sub": "One upload, many tasks",
      "teaches": "Transcoding is expensive and different creators want different processing (some want watermarks, some upload their own thumbnail, some upload HD). The book adopts a DAG model, like Facebook's streaming video engine (SVE): DAG = directed acyclic graph, a set of tasks with arrows meaning 'must finish before', and no loops. It defines tasks in stages so they run sequentially or in parallel, giving flexibility and parallelism. The book's DAG: the original video is split into video, audio and metadata. Video tasks: inspection (make sure the video is good quality and not malformed); video encodings (convert to different resolutions, codecs and bitrates, e.g. 360p.mp4, 480p.mp4, 720p.mp4, 1080p.mp4, 4k.mp4); thumbnail (uploaded by the user or generated automatically); watermark (an image overlay with identifying info). Audio: audio encoding. Everything is then assembled into the encoded output.",
      "interaction": "Node-wiring puzzle. Nodes on screen: Original video, Split, Video, Audio, Metadata, Inspection, Video encodings (x5 resolution tiles), Thumbnail, Watermark, Audio encoding, Assemble. The learner drags arrows between nodes. Accepted graph: Original -> Split -> {Video, Audio, Metadata}; Video -> Inspection -> {Video encodings, Thumbnail, Watermark}; Audio -> Audio encoding; all leaves -> Assemble (accept Watermark either feeding the encodings or running in parallel). Validator highlights: a missing prerequisite in red ('Assemble needs audio'), or a loop ('Assemble -> Inspection makes a cycle: the scheduler could never finish'). Then the 'Run it' button: each task has a duration (e.g. inspection 2 s, each encoding 8 s, thumbnail 1 s, audio 3 s); a timeline shows sequential total (~50 s) vs DAG parallel total (~13 s, the longest path). The learner predicts the parallel time first (choices) before it animates; the longest path glows as the 'critical path'.",
      "check": "Q.quiz (2 Qs): (1) Why must the graph be acyclic? -> a loop means a task waits on itself; there'd be no valid order to run it. (2) What decides how fast the DAG finishes with unlimited workers? -> the longest chain of dependent tasks (critical path), not the total work."
    },
    {
      "title": "Boss: The Format Hydra",
      "sub": "Every head wants a different format",
      "teaches": "Applying transcoding knowledge to product requests.",
      "interaction": "Q.boss() with 5 cards. (1) 'Product wants creators to opt into a watermark.' -> add/omit a watermark task in that creator's DAG config, no code change to the pipeline. (2) 'Viewers on a train complain about spinners.' -> ABR with a full bitrate ladder (multiple renditions + manifest) so the player can step down. (3) 'Transcoding a 1-hour video takes an hour because encodings run one after another.' -> run the 5 resolution encodings as parallel DAG branches (and, preview of 14.4, split into GOP chunks). (4) 'A file is corrupt.' -> inspection fails early and the pipeline stops before wasting encoding work (non-recoverable error). (5) 'An old TV can't play our files.' -> also produce a widely supported codec/container (e.g. H.264 in MP4).",
      "check": "Pass at 4/5."
    },
    {
      "title": "Say it like a senior",
      "sub": "Why transcode, and how",
      "teaches": "Recall.",
      "interaction": "Q.drill(): prompt 'Explain to the interviewer why we transcode and how the work is organised.' Checklist: four reasons (storage, compatibility, bandwidth-matched quality, changing networks); container vs codec with examples; multiple renditions + manifest -> player switches quality per segment (ABR); DAG model from Facebook SVE: split into video/audio/metadata, inspection, encodings, thumbnail, watermark, audio encoding, assemble; parallel branches cut latency; config-driven so creators' needs differ without code changes.",
      "check": "Self-grade per checklist line."
    }
  ],
  "caveats": [
    "The book's 'few hundred GB per hour of HD at 60 fps' describes a high-bitrate camera or production master. Truly uncompressed 1080p60 is over 1 TB per hour; a streaming encode is a few GB. The sim shows all three so the numbers don't get mixed up.",
    "The book only names the streaming protocols. Adaptive bitrate switching (manifest + segments + a player algorithm) is the mechanism that actually delivers 'change video quality'; real players use throughput-based or buffer-based algorithms.",
    "The book lists H.264, VP9 and HEVC. YouTube now also serves AV1 widely. Real services also tune the bitrate ladder per title (Netflix's per-title encoding) instead of using one fixed ladder.",
    "The DAG drawing in the book is simplified. In real pipelines a watermark is usually burned in during encoding, not as a separate parallel output. The exact edges here are our reading of the figure."
  ],
  "sources": [BOOK, SVE, ABR, HLS, PERTITLE]
})

# ---------------------------------------------------------------- 14.4
quests.append({
  "n": "14.4",
  "slug": "youtube-transcoding-architecture",
  "t": "The Transcoding Factory",
  "d": "Preprocessor, DAG scheduler, resource manager, task workers, temporary storage",
  "boss": False,
  "badge": "🏭 Badge: Factory Foreman",
  "winTitle": "The factory runs itself",
  "goal": "Your win today: you can name the six parts of the book's video transcoding architecture, explain GOP splitting, and run the resource manager's three queues step by step, including what happens when a worker dies mid-task.",
  "bookSections": "Step 3 deep dive: Video transcoding architecture: Preprocessor, DAG scheduler, Resource manager, Task workers, Temporary storage, Encoded video",
  "stages": [
    {
      "title": "Factory floor tour",
      "sub": "Six stations, six jobs",
      "teaches": "The book's transcoding architecture, left to right: Preprocessor -> DAG scheduler -> Resource manager -> Task workers -> Encoded video, with Temporary storage used along the way. Preprocessor: splits the video, generates the DAG, caches data. DAG scheduler: splits the DAG into stages of tasks and puts them in the resource manager's task queue. Resource manager: allocates tasks to workers efficiently. Task workers: run the tasks defined in the DAG (different worker types: watermark, encoder, thumbnail, merger). Temporary storage: holds intermediate data (GOPs, metadata) while processing. Encoded video: the final output, e.g. funny_720p.mp4.",
      "interaction": "Tap-to-match. Six station silhouettes on a conveyor; six job cards ('turns a config into a task graph and chops the video', 'splits the graph into stages', 'picks which worker runs which task', 'actually encodes/watermarks/merges', 'holds GOPs and metadata mid-process', 'the finished funny_720p.mp4'). Learner taps a card then a station; correct pairs light the station up and start a small conveyor animation. When all six are lit, a demo video box travels the full line.",
      "check": "Q.quiz (2 Qs): (1) Which component turns client-written config files into a DAG? -> the preprocessor. (2) Which component actually executes the encoding? -> task workers."
    },
    {
      "title": "Chop by GOP",
      "sub": "Cut the film where it's safe",
      "teaches": "Preprocessor duties (book): (1) Video splitting: the video stream is split, or further split, into smaller Group of Pictures (GOP) alignment. A GOP is a group/chunk of frames arranged in a specific order; each chunk is an independently playable unit, usually a few seconds long. (2) Some old mobile devices or browsers can't split by GOP, so the preprocessor does it on the server for them. (3) DAG generation: generates the DAG from configuration files that client programmers write (book example: two tasks, 'download-input' then 'transcode'). (4) Cache data: the preprocessor is a cache for segmented videos; for reliability it stores GOPs and metadata in temporary storage, so if encoding fails the system can retry from the persisted data instead of starting over. Why GOPs are independent: a GOP starts with a keyframe (I-frame, a full picture); the following P/B frames only store changes relative to other frames, so you can only cut safely at a keyframe.",
      "interaction": "Filmstrip cutter. A strip of 48 frames labelled I, P or B (an I every 12 frames). The learner clicks gaps between frames to place up to 3 cuts. A cut placed right before an I-frame turns green; a cut elsewhere makes the next chunk start with a P-frame, and its preview shows a smeared, glitchy thumbnail ('this chunk refers to a frame it doesn't have'). After valid cuts, a 'Encode' button runs: 1 worker encoding the whole strip sequentially (bar takes 8 s) vs 4 workers each encoding one GOP chunk in parallel (2 s), then a merger worker stitches them. Then a 'crash' button kills one worker mid-chunk: with temporary storage ON only that chunk is re-encoded; with it OFF the whole video restarts. Learner predicts the retry cost before each toggle.",
      "check": "Q.quiz (2 Qs): (1) Why split at GOP boundaries? -> each GOP starts with a keyframe and decodes on its own, so chunks can be encoded in parallel and played independently. (2) Why does the preprocessor persist GOPs in temporary storage? -> a failed encode can retry just the failed piece from saved data."
    },
    {
      "title": "Stage the DAG",
      "sub": "Turn a graph into waves of work",
      "teaches": "DAG scheduler: splits the DAG into stages of tasks and puts them in the task queue of the resource manager. Book example: Stage 1 splits the original video into video, audio and metadata; Stage 2 runs video encoding and thumbnail on the video, and audio encoding on the audio. Tasks in the same stage don't depend on each other, so they can run in parallel; a stage starts when its inputs are ready.",
      "interaction": "Stage sorter. The DAG from 14.3 is shown (simplified to: Split; Video encoding; Thumbnail; Audio encoding; Assemble). Three stage columns. The learner drags each task into Stage 1, 2 or 3. Correct: Split in 1; Video encoding, Thumbnail, Audio encoding in 2; Assemble in 3. A wrong placement draws the violated arrow in red ('Thumbnail needs the video stream, which Split produces in Stage 1'). Then a 'push to queue' animation drops Stage-1 tasks into the resource manager's task queue (linking to the next stage).",
      "check": "Q.quiz (1-2 Qs): (1) Can two tasks in the same stage depend on each other? -> no, then they'd need to be in different stages. (2) Where does the DAG scheduler put ready tasks? -> the resource manager's task queue."
    },
    {
      "title": "Run the resource manager",
      "sub": "You are the task scheduler",
      "teaches": "Resource manager = 3 queues + a task scheduler. Task queue: a priority queue of tasks to be executed. Worker queue: a priority queue of worker utilisation info. Running queue: info about the tasks currently running and the workers running them. Task scheduler loop (book): (1) get the highest-priority task from the task queue; (2) get the optimal task worker to run it from the worker queue; (3) instruct the chosen worker to run the task; (4) bind the task/worker info and put it in the running queue; (5) remove the job from the running queue once it is done. Priority queue = a queue that always hands out the most important item first, not the oldest.",
      "interaction": "Hands-on scheduler game. Screen: task queue (cards with priority 1-5 and a type: encode / thumbnail / watermark / merge), worker queue (8 worker cards with type and a load bar), running queue (empty table), and a scheduler 'hand'. Each tick the learner must: tap the top task, tap a suitable worker, press Run. The engine checks: wrong task picked (not highest priority) -> -1 XP and hint; wrong worker type (encode task to a thumbnail worker) -> heart lost; busy worker when an idle one of the right type exists -> -1 XP ('not optimal'). Correct picks move a task<->worker pair into the running queue; it disappears after its duration (step 5). After 6 manual ticks, 'Autopilot' runs the loop quickly. Final twist: an encoder worker turns red (dies) mid-task; the learner must choose what happens: drop the task / put it back on the task queue to retry on another worker / wait for the worker (correct: re-queue and retry on a new worker, book error-handling rule 'task worker down').",
      "check": "Q.quiz (2 Qs): (1) What does the running queue let you do when a worker dies? -> see which task it held so you can re-queue it. (2) Why a priority queue for workers? -> to always pick the least-loaded/most suitable worker quickly."
    },
    {
      "title": "Where does it live?",
      "sub": "Temporary storage and the final output",
      "teaches": "Temporary storage: the book uses multiple storage systems; the choice depends on data type, data size, access frequency and data life span. Metadata is small and frequently accessed by workers -> cache it in memory. Video and audio data -> put in blob storage. Data in temporary storage is freed once the video processing is complete. Encoded video: the final output of the pipeline, e.g. funny_720p.mp4, which goes to transcoded storage and the CDN (back in the 14.2 diagram).",
      "interaction": "Sort-and-clean. 6 data items appear with tags for size and how often they're read: 'task metadata (2 KB, read 100x/min)', 'GOP chunk 12 (40 MB, read twice)', 'audio track (20 MB)', 'DAG config (1 KB)', 'thumbnail draft (200 KB)', 'funny_720p.mp4 (final)'. The learner drops each into Memory cache / Blob storage (temporary) / Transcoded storage (permanent). Then a 'video finished' bell rings and the learner must click 'free' on everything that should be deleted from temporary storage (everything except the final output). Leaving junk shows a growing storage bill counter.",
      "check": "Q.quiz (1 Q): Which four factors decide where temporary data lives? -> type, size, access frequency, life span."
    },
    {
      "title": "Boss: The Backlog Golem",
      "sub": "The factory under pressure",
      "teaches": "Applying the architecture to load and failure.",
      "interaction": "Q.boss() with 5 cards. (1) 'A popular creator uploads; 10,000 viewers are waiting, but the task queue is full of 3-hour lecture uploads.' -> priority in the task queue (e.g. boost the popular/short job), not FIFO. (2) 'Encoding of chunk 37 of 400 fails.' -> retry just that chunk from GOPs in temporary storage; don't restart the whole video. (3) 'An old Android client uploads one huge file without GOP splitting.' -> the preprocessor splits on the server. (4) 'A new creator feature needs a different processing step.' -> change the DAG config the preprocessor reads; the scheduler and workers stay the same. (5) 'Temporary storage keeps growing forever.' -> free intermediate data once processing completes.",
      "check": "Pass at 4/5."
    },
    {
      "title": "Say it like a senior",
      "sub": "Tour the factory out loud",
      "teaches": "Recall.",
      "interaction": "Q.drill(): prompt 'Draw and narrate the video transcoding architecture.' Checklist: preprocessor (GOP splitting incl. for old clients, DAG generation from config, caching GOPs/metadata in temp storage for retries); DAG scheduler (stages -> task queue); resource manager (task queue, worker queue, running queue, the 5-step scheduler loop); task workers by type (encoder, thumbnail, watermark, merger); temporary storage chosen by type/size/frequency/life span, freed after; encoded output e.g. funny_720p.mp4.",
      "check": "Self-grade per checklist line."
    }
  ],
  "caveats": [
    "Chunked parallel encoding is real (Facebook's SVE does it), but chunk boundaries can cost a little quality and need closed GOPs (chunks that don't reference frames outside themselves). Encoders often re-insert keyframes on purpose to make clean cut points.",
    "The book's resource manager is an illustrative design (inspired by SVE and a Weibo talk). Real systems often use a general-purpose job scheduler or a cloud batch/queue service instead of a custom three-queue scheduler.",
    "Priorities in the task queue are the book's idea; the book doesn't say what decides them. Popularity, creator tier and video length are plausible examples, not the book's rules.",
    "Retrying a task on a new worker is only safe if tasks are idempotent: running the same encode twice must produce the same output, not a duplicate."
  ],
  "sources": [BOOK, SVE, GOP]
})

# ---------------------------------------------------------------- 14.5
quests.append({
  "n": "14.5",
  "slug": "youtube-optimizations-and-errors",
  "t": "Faster, Safer, Cheaper",
  "d": "Speed, safety and cost optimisations, plus the book's error-handling playbook",
  "boss": False,
  "badge": "⚙️ Badge: Tuning Wizard",
  "winTitle": "Faster, safer, cheaper, and still standing",
  "goal": "Your win today: you can list the book's optimisations by category (speed, safety, cost), explain pre-signed URLs and the long-tail CDN strategy, and answer 'what happens if X goes down?' for every component.",
  "bookSections": "Step 3 deep dive: System optimizations (speed: parallelize video uploading, upload centers close to users, parallelism everywhere; safety: pre-signed upload URL, protect your videos; cost-saving); Error handling (recoverable vs non-recoverable, per-component table)",
  "stages": [
    {
      "title": "Upload speed run",
      "sub": "Chunks, resumes and nearby upload centers",
      "teaches": "Speed optimisations for uploads (book): (1) Parallelize video uploading: split the video into smaller chunks by GOP alignment; this allows fast, resumable uploads when a previous upload failed. The splitting can be done by the client. (2) Place upload centers close to users, e.g. North America users upload to a North American center; the book suggests using the CDN as upload centers. Resumable = after a failure, continue from the last finished chunk instead of from byte 0.",
      "interaction": "Upload race simulation. A 1 GB file, a 50 Mbit/s link, and a scripted network drop at 70%. Lane A: single upload; the drop resets it to 0% and it restarts. Lane B: 10 chunks of 100 MB, 4 at a time; the drop kills only the chunks in flight, which restart. Before pressing Go, the learner predicts which lane finishes first and roughly how much time Lane A wastes (choices). Then a second toggle: upload center 'far' (200 ms round trip) vs 'near' (20 ms); the learner predicts the effect on per-chunk handshake time, then watches Lane B speed up.",
      "check": "Q.quiz (2 Qs): (1) What two benefits does chunked upload give? -> parallel transfer and resuming after failure. (2) Why put upload centers near users? -> shorter round trips and fewer hops make uploads faster and more reliable."
    },
    {
      "title": "Queues between everything",
      "sub": "Loose coupling for parallelism",
      "teaches": "Parallelism everywhere (book): build a loosely coupled system with high parallelism by putting message queues between modules. Before: the encoding module must wait for the download module's output. After: modules no longer wait on each other directly; if there are events in the queue, the encoding module can process them in parallel. Message queue = a buffer where producers drop messages and consumers pick them up at their own pace.",
      "interaction": "Before/after pipeline. Three modules (Download -> Encoding -> Upload to storage) process a stream of 10 videos with random durations. Toggle 'No queues': each module waits for the previous one to hand over directly; idle time shows as grey bars on a timeline; total time is displayed. Toggle 'Queues': a queue icon sits between modules; encoders pull whenever work is available and two encoding workers run at once. The learner predicts the new total time (choice of 3) before switching. Bonus: a 'burst' button drops 20 uploads at once; with queues the backlog grows then drains, without queues the download module is blocked.",
      "check": "Q.quiz (2 Qs): (1) What does the queue let the encoding module stop doing? -> waiting synchronously for the download module. (2) Name one cost of adding queues. -> more moving parts and harder end-to-end debugging/latency tracking."
    },
    {
      "title": "Lock the vault",
      "sub": "Pre-signed URLs and protecting videos",
      "teaches": "Safety optimisations. Pre-signed upload URL: so only authorised users upload videos to the right location. Flow: (1) the client makes an HTTP request to the API servers to fetch a pre-signed URL, which grants access permission to the object identified in the URL; (2) the API servers respond with the pre-signed URL; (3) the client uploads the video directly to storage using that URL. 'Pre-signed URL' is the Amazon S3 term; Azure Blob Storage calls it a 'Shared Access Signature'. Protect your videos (book's three options): Digital Rights Management (DRM) systems: Apple FairPlay, Google Widevine, Microsoft PlayReady; AES encryption: encrypt the video and configure an authorisation policy, it is decrypted on playback so only authorised users can watch; visual watermarking: an image overlay on the video with identifying info such as your company logo or name.",
      "interaction": "Two parts. Part 1 'Bouncer': a sequence diagram plays the 3-step flow. Then 4 upload attempts arrive at the storage door, each showing a URL with fields (object key, expiry, signature, method): (a) valid; (b) expired 10 minutes ago; (c) object key changed from user123/video.mp4 to user999/video.mp4 with the old signature; (d) valid URL but sent to a different bucket. The learner stamps ACCEPT or REJECT (403) on each; explanation: the signature covers key + expiry + method, so any tampering breaks it. Part 2 'Threat match': 3 threats ('someone downloads and re-uploads the full movie', 'a stranger uploads to another user's folder', 'a leaked clip shows up on another site and you need to know where it came from') matched to defenses (DRM/AES encryption, pre-signed URL, watermark).",
      "check": "Q.quiz (2 Qs): (1) Does the video file pass through the API servers with pre-signed URLs? -> no, the client uploads directly to storage; API servers only issue the URL. (2) Name the three big DRM systems. -> FairPlay, Widevine, PlayReady."
    },
    {
      "title": "Tame the long tail",
      "sub": "Cut the $150k/day CDN bill",
      "teaches": "Cost-saving (book): the CDN is crucial but expensive (recall $150,000/day). YouTube video streams follow a long-tail distribution: a few popular videos are watched very often, and most videos have few or no viewers. Optimisations: (1) only serve the most popular videos from the CDN, and other videos from high-capacity storage video servers; (2) for less popular content you may not need many encoded versions; short videos can be encoded on demand; (3) some videos are popular only in certain regions, so don't distribute them to other regions; (4) build your own CDN like Netflix and partner with Internet Service Providers (ISPs): a giant project, but it can make sense for large streaming companies; ISPs are close to users, so it improves viewing and cuts bandwidth charges. All of these depend on content popularity, user access patterns and video size: analyse historical viewing patterns before optimising.",
      "interaction": "Cost dashboard. A long-tail chart of 1,000 videos sorted by views (steep head, flat tail). A slider 'top X% of videos on the CDN' (0-100%) recolours bars as CDN vs origin video servers. Two meters update: daily cost (starting at the book's $150k with 100% on CDN) and 'average viewer latency'. Tactic toggles add their own savings: 'fewer encodings for the tail', 'encode short videos on demand' (adds a first-view delay warning), 'region-only distribution', 'own CDN + ISP partnership' (big savings but a 'multi-year build' badge and a fixed cost). Before moving the slider, the learner predicts what share of views the top 10% of videos gets (choices; the sim's Zipf data gives about 80%). Goal: get cost under a target (e.g. $60k/day, illustrative) while keeping latency green.",
      "check": "Q.quiz (2 Qs): (1) Why does the long tail make 'popular-only on CDN' work? -> most views hit a small set of videos, so caching those covers most traffic. (2) What must you do before choosing these optimisations? -> analyse historical viewing patterns (popularity, region, size)."
    },
    {
      "title": "Incident pager",
      "sub": "The book's error-handling playbook",
      "teaches": "Two error types: recoverable (e.g. a video segment fails to transcode: retry a few times; if it keeps failing and the system thinks it's not recoverable, return a proper error code to the client) and non-recoverable (e.g. a malformed video format: stop the tasks for that video and return an error code). Book's per-component playbook: upload error -> retry a few times; split video error -> if older clients can't split by GOP, pass the whole video to the server and split it there; transcoding error -> retry; preprocessor error -> regenerate the DAG; DAG scheduler error -> reschedule the task; resource manager queue down -> use a replica; task worker down -> retry the task on a new worker; API server down -> API servers are stateless, so send requests to a different API server; metadata cache server down -> data is replicated, so read from other nodes and bring up a new cache server to replace the dead one; metadata DB server down -> if the master is down, promote one of the slaves (replicas) to master; if a slave is down, read from another slave and bring up a replacement.",
      "interaction": "Timed incident feed. First, a quick sort of 6 errors into Recoverable vs Non-recoverable (timeout, segment fails once, malformed file, network blip, unsupported/corrupt container, worker crash). Then the 'pager' goes off: 11 alerts arrive one at a time on a phone-style screen (e.g. 'PAGE: metadata DB primary unreachable'). For each the learner picks the fix from 3 cards within 15 seconds (timer is soft: running out costs XP, not a heart; wrong fix costs a heart). A status board of the architecture turns each component red then green as it's fixed. After the run, a recap table shows the full playbook.",
      "check": "Q.quiz (2 Qs): (1) Why can any API server take any request? -> they're stateless; state lives in the DB/cache. (2) The metadata DB primary dies. Book's move? -> promote a replica to primary."
    },
    {
      "title": "Boss: The Penny-Pinching Pirate",
      "sub": "Speed, safety, cost, failure",
      "teaches": "Mixed scenarios across all optimisations and failures.",
      "interaction": "Q.boss() with 6 cards. (1) 'Users in India say uploads crawl and often restart from zero.' -> GOP/chunked resumable uploads + upload centers near users. (2) 'Someone uploads to another user's folder using a URL they found.' -> pre-signed URLs scoped to that object and with a short expiry. (3) 'Finance: the CDN bill is out of control.' -> serve only the popular head from the CDN, tail from video servers; fewer renditions for the tail; regional distribution. (4) 'A premium film is being pirated as full files.' -> DRM (Widevine/FairPlay/PlayReady) or AES encryption with an authorisation policy; watermark to trace leaks. (5) 'A task worker crashed mid-encode.' -> retry the task on a new worker. (6) 'Uploaded file is not a valid video.' -> non-recoverable: stop the tasks and return an error code; don't retry forever.",
      "check": "Pass at 5/6."
    },
    {
      "title": "Say it like a senior",
      "sub": "Optimise out loud",
      "teaches": "Recall.",
      "interaction": "Q.drill(): prompt 'The interviewer asks: how would you make this faster, safer and cheaper, and what happens when parts fail?' Checklist: speed: parallel chunked (GOP) resumable uploads, upload centers near users / CDN as upload centers, message queues between modules; safety: pre-signed URLs (SAS on Azure), DRM (FairPlay/Widevine/PlayReady), AES encryption, visual watermark; cost: long tail, popular-only on CDN, fewer encodings/on-demand for the tail, regional distribution, own CDN + ISPs (Netflix), analyse viewing history first; errors: recoverable -> retry then error code; non-recoverable -> stop and error code; stateless API failover, replica promotion, cache rebuild, re-queue tasks.",
      "check": "Self-grade per checklist line."
    }
  ],
  "caveats": [
    "Real uploaders usually chunk by bytes, not by GOP (S3 multipart upload, YouTube's resumable upload protocol), and leave GOP-aware splitting to the server. The book's client-side GOP splitting is possible, but less common.",
    "'Use the CDN as upload centers' really means edge ingest (for example S3 Transfer Acceleration routing uploads through CloudFront edges). Not every CDN offers it.",
    "AES encryption without a DRM system (e.g. HLS AES-128 with a key URL) is weaker than real DRM: anyone who can fetch the key can decrypt. Visual watermarks deter and trace leaks; they don't block copying. Nothing stops someone filming a screen with a camera.",
    "Promoting a replica to primary can lose the last few writes if replication was asynchronous. Retries need backoff and idempotent tasks.",
    "Netflix gives its Open Connect appliances to ISPs for free; YouTube has a similar program (Google Global Cache). The savings in the cost sim are illustrative, not real figures."
  ],
  "sources": [BOOK, S3PRE, SAS, S3MPU, YTRES, WIDEVINE, FAIRPLAY, OC, LONGTAIL]
})

# ---------------------------------------------------------------- BOSS
quests.append({
  "n": "BOSS",
  "slug": "youtube-boss-design-it-live",
  "t": "Design YouTube Live",
  "d": "Full mock interview: design a video upload and streaming service",
  "boss": True,
  "badge": "🎬 Badge: Showrunner",
  "winTitle": "That's a wrap: offer incoming",
  "goal": "Your win today: you can run the whole 'Design YouTube' interview in about 45 minutes: scope and estimate, draw the upload and streaming flows, go deep on transcoding and optimisations, handle failure curveballs, and close with scaling, live streaming and takedowns.",
  "bookSections": "Whole chapter, following the 4-step framework; Step 4: wrap up (scale API tier, scale database, live streaming, video takedowns)",
  "stages": [
    {
      "title": "Scope it",
      "sub": "Step 1 · understand the problem (3-10 min)",
      "teaches": "Same 4-step framework and game clock as lesson 0008 (Step 1 3-10 min, Step 2 10-15 min, Step 3 10-25 min, Step 4 3-5 min; 45-minute game clock). Scope: upload + watch; mobile/web/smart TV; 5M DAU; 30 min/day; international; most resolutions; encryption; max 1 GB; managed cloud allowed. Estimates: 150 TB/day new storage; ~$150k/day CDN.",
      "interaction": "Requirements board with game clock (reuse 0008 pattern): pick the right questions from 14 chips (time-wasters burn 3 game-minutes). Then a fast 2-field estimate: type daily storage and daily CDN cost (tolerance +-10%); each correct field earns 'signal' points shown on a signal meter.",
      "check": "Stage clears when all key requirements are pinned and both numbers are within tolerance."
    },
    {
      "title": "Sketch it",
      "sub": "Step 2 · high-level design and buy-in (10-15 min)",
      "teaches": "High-level design: client, CDN for streaming, API servers for everything else; the upload flow (load balancer, API servers, metadata DB + cache, original storage, transcoding servers, transcoded storage, CDN, completion queue, completion handler) and the parallel metadata update; streaming from the nearest edge via HLS/DASH.",
      "interaction": "Blank whiteboard (0008 stage 2 pattern): tap components in dependency order; a component whose input isn't drawn yet costs 1 game-minute; decoys (e.g. 'GraphQL gateway', 'blockchain ledger', 'search cluster') cost a heart. Then the interviewer asks 'Walk me through an upload': the learner taps the arrows in the book's numbered order (1, 2, 3a, 3a.1, 3b, 3b.1, 3b.1.a/b, 4), with 3a/3b required as a parallel pair.",
      "check": "Clears when the diagram is complete and the upload walkthrough is in a valid order."
    },
    {
      "title": "The mechanism map",
      "sub": "Step 3 · every requirement needs a mechanism",
      "teaches": "The chapter's answer key: fast uploads -> parallel chunked resumable uploads + upload centers near users; smooth streaming -> CDN edges + streaming protocols (HLS/DASH) with adaptive bitrate; change video quality -> transcode into many resolutions/bitrates; device compatibility -> multiple codecs/containers; flexible processing -> DAG model (configurable per creator); transcoding throughput -> GOP splitting + DAG scheduler + resource manager + task workers + message queues; upload security -> pre-signed URLs; content protection -> DRM / AES / watermark; low cost -> long-tail CDN strategy, regional distribution, fewer encodings for the tail, own CDN with ISPs; high availability -> retries, replicas, stateless API servers.",
      "interaction": "Table rebuild (0008 stage 3 pattern): left column lists 10 goals; the learner taps the matching technique chip for each from a shuffled bank of ~13 (some techniques serve several goals, 2-3 decoys like 'two-phase commit', 'consistent hashing of users'). Each correct row costs 1 game-minute and adds signal. A 'deep dive' prompt then asks the learner to pick ONE area to go deep on (transcoding architecture or cost optimisation) and order 5 talking points for it.",
      "check": "Clears when all rows are correct (retries allowed, wrong taps cost a heart)."
    },
    {
      "title": "Boss: the curveball barrage",
      "sub": "Step 3 · 'what happens when...?'",
      "teaches": "Failure and trade-off follow-ups mixed from 14.1-14.5.",
      "interaction": "Q.boss() with 9 curveballs, each 1.5 game-minutes when right, a heart + 1 minute when wrong: (1) a transcoding worker dies mid-chunk -> re-queue, retry on a new worker from GOPs in temp storage; (2) metadata DB primary dies -> promote a replica; (3) the completion handler is down for 10 minutes -> events wait in the completion queue; videos show 'processing' until it recovers; nothing lost; (4) the upload drops at 90% on mobile -> resumable chunked upload resends only missing chunks; (5) a viral video in one country -> CDN/regional distribution of the hot video; (6) the CDN bill doubled -> long-tail strategy; (7) someone reuses an upload URL tomorrow -> pre-signed URL has expired; (8) user uploads a corrupt file -> non-recoverable, stop and return an error code; (9) an API server crashes -> stateless, the load balancer sends traffic to another.",
      "check": "Clears at 7/9."
    },
    {
      "title": "Wrap it up",
      "sub": "Step 4 · the last 3-5 minutes",
      "teaches": "Book's wrap-up extras: scale the API tier (stateless API servers -> scale horizontally); scale the database (replication and sharding); live streaming (recording and broadcasting in real time; it shares upload, encoding and streaming with this design but differs: higher latency requirement, so it may need a different streaming protocol; lower need for parallelism because small chunks are already processed in real time; different error handling, since slow error handling isn't acceptable); video takedowns (videos that violate copyrights, pornography or other illegal acts must be removed; some are caught during upload, others through user flagging).",
      "interaction": "Pick exactly 3 closing moves from 8 cards (0008 stage 5 pattern): the 4 book topics above, a 'recap of the bottlenecks' card (also good), and decoys ('rewrite it in Rust', 'add blockchain for ownership', 'redesign the logo'). Each chosen good card expands into a 2-line spoken close the learner must complete by choosing the right detail (e.g. live streaming: 'needs ___ latency, ___ parallelism' -> lower latency, less parallelism). 'Deliver my close' reveals the interviewer's reaction.",
      "check": "Clears when 3 strong closing moves are delivered with correct details."
    },
    {
      "title": "Say it like a senior",
      "sub": "The 60-second version + your scorecard",
      "teaches": "The whole design in one breath.",
      "interaction": "Q.drill(): prompt 'Give the 60-second summary of your YouTube design.' Model answer + checklist (scope + 2 numbers; CDN streams, API servers do the rest; upload flow with the completion queue; transcoding with DAG + GOP + resource manager; ABR renditions; pre-signed URLs + DRM; long-tail cost plan; error handling; wrap-up topics). Then a scorecard card: game minutes used, signal earned, hearts left, stored under its own key (like 0008: 'sdq:v1:<id>-interview') so replays can be compared.",
      "check": "Self-grade per checklist line; victory when all stages are cleared."
    }
  ],
  "caveats": [
    "The minute ranges are the book's suggestions for a roughly 45-minute session; the game clock is our framing. Real loops vary.",
    "The book doesn't cover the rest of YouTube: recommendations, search, comments, view counting, monetisation. Some interviewers will push into one of these; scope it explicitly.",
    "Live streaming in practice uses ingest protocols such as RTMP or SRT and low-latency variants of HLS/DASH. The book only sketches how live differs.",
    "Takedowns at YouTube's scale rely on automated fingerprinting (Content ID) as well as user flagging. The book mentions only 'during upload' and 'flagging'."
  ],
  "sources": [BOOK, SVE, S3PRE, OC, CONTENTID, CF]
})

plan = {
  "world": 14,
  "chapterTitle": "Design YouTube",
  "worldName": "The Stream Machine",
  "quests": quests,
  "cheatsheetOutline": (
    "One page, one section per quest, plus key numbers and the final design. "
    "Header: 'Design YouTube' + the 4-step framework strip with minute ranges. "
    "1) 14.1 Size Up the Tube: scope (upload + watch; mobile/web/smart TV; 5M DAU; 30 min/day; international; most resolutions; encryption; max 1 GB; managed cloud OK); NFRs (fast upload, smooth stream, change quality, low cost, HA/scalable/reliable). "
    "2) 14.2 Upload Lane, Watch Lane: three boxes (client, CDN, API servers); upload flow diagram with the numbered steps 1, 2, 3a, 3a.1, 3b, 3b.1, 3b.1.a/b, 4 and the parallel metadata flow b; streaming vs downloading; protocols (MPEG-DASH, HLS, Smooth Streaming, HDS); stream from the nearest edge. "
    "3) 14.3 The Format Forge: four reasons to transcode; container (.mp4/.mov/.avi) vs codec (H.264/VP9/HEVC, +AV1); bitrate ladder + manifest = adaptive bitrate; the DAG figure (split -> video/audio/metadata -> inspection, encodings, thumbnail, watermark, audio encoding -> assemble). "
    "4) 14.4 The Transcoding Factory: pipeline diagram (preprocessor -> DAG scheduler -> resource manager -> task workers -> encoded video, temp storage underneath); GOP definition; the 3 queues + 5-step scheduler loop; temp storage rule (type, size, frequency, life span; metadata in memory, video/audio in blob; freed after). "
    "5) 14.5 Faster, Safer, Cheaper: 3-column table speed / safety / cost; pre-signed URL 3-step sequence (SAS on Azure); DRM trio; long-tail chart with the 4 cost tactics; error playbook table (11 rows: component -> fix) + recoverable vs non-recoverable. "
    "6) BOSS: the requirement -> mechanism table; wrap-up topics (scale API tier, scale DB, live streaming differences, takedowns). "
    "Key numbers box: 2B MAU / 5B views/day (book intro, ~2019); 5M DAU; 5 videos watched/user/day; 10% upload 1/day; 300 MB avg; 150 TB/day new storage (originals only); $0.02/GB CloudFront -> ~$150k/day CDN; 1 GB max upload; 'hour of HD at 60 fps = a few hundred GB'. "
    "Final design: one combined diagram (upload path + transcoding factory + CDN streaming path) with the optimisation call-outs. "
    "Footer: honest caveats in one line each (originals-only storage, CDN price tier, byte vs GOP chunking, AES is not DRM, replica promotion can lose writes)."
  )
}

out = "/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/plans/ch14.json"
with open(out, "w") as f:
    json.dump(plan, f, ensure_ascii=False, indent=2)
print("ok", len(quests), [len(q["stages"]) for q in quests])
