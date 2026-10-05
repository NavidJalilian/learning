# System Design Resources

## Knowledge

- [Book: _System Design Interview — An Insider's Guide_ (Vol. 1) — Alex Xu (also on ByteByteGo)](https://bytebytego.com/courses/system-design-interview/design-a-key-value-store)
  The spine of this track; lessons follow its chapters. Use for: the "expected" interview answer for each design.
- [Paper: "Dynamo: Amazon's Highly Available Key-value Store" — DeCandia et al., SOSP 2007](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
  The real system Chapter 6 is modeled on. Use for: the shopping-cart "always writeable" AP example, quorums, vector clocks, hinted handoff, Merkle trees.
- [Paper: "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services" — Gilbert & Lynch, 2002](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf)
  The formal proof of CAP. Use for: what "consistency" precisely means in CAP (linearizability).
- [Article: "CAP Twelve Years Later: How the 'Rules' Have Changed" — Eric Brewer, 2012](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/)
  The theorem's author explaining why "pick 2 of 3" is misleading. Use for: the nuance an interviewer may probe.
- [Article: "Please stop calling databases CP or AP" — Martin Kleppmann, 2015](https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html)
  Why real databases don't fit neatly into CP/AP boxes. Use for: senior-level caveats once the basics land.
- [Book chapter: "Design Consistent Hashing" (Ch. 5) — Alex Xu](https://bytebytego.com/courses/system-design-interview/design-consistent-hashing)
  Ring, virtual nodes, k/n movement, ~10%/5% spread at 100/200 vnodes. Use for: quest 6.2.
- [Book chapter: "A Framework for System Design Interviews" (Ch. 3) — Alex Xu](https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews)
  The 4-step interview (scope 3–10 / high-level 10–15 / deep dive 10–25 / wrap 3–5 min). Use for: every boss/mock interview.
- [Docs: Apache Cassandra — Dynamo architecture, storage engine, hints, Bloom filters](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html)
  How a production Dynamo-style store actually does it (LWW instead of vector clocks, per-DC replication, 3-hour hint window, commit log sync modes). Use for: honest "real systems differ" caveats.
- [Paper: "A Gossip-Style Failure Detection Service" — van Renesse, Minsky & Hayden, 1998](https://www.cs.cornell.edu/home/rvr/papers/GossipFD.pdf)
  The heartbeat-counter gossip detector the book describes. Use for: quest 6.6.
- [Book: _Designing Data-Intensive Applications_ — Martin Kleppmann](https://dataintensive.net/)
  Deeper theory behind every chapter. Use for: replication, partitioning, consistency models.

## Wisdom (Communities)

- Not yet chosen. Candidates: r/ExperiencedDevs, mock-interview partners (e.g. Pramp/interviewing.io peers). Offer once the user has a full chapter design to present.

## Gaps
- No interactive CAP simulator from a trusted source — the lesson builds its own.
