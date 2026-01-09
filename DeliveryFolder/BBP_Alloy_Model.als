// ===== Imports =====
open util/boolean        // Bool, True, False
open util/integer        // Int 加减比较

// ===== 1) Road graph =====
sig Node {}

abstract sig Status {}
one sig Optimal, Medium, Sufficient, RequiresMaintenance extends Status {}

sig Segment {
  start: one Node,
  end:   one Node,
  statusHint: lone Status
} { start != end }

// ===== 2) Users, trips, automatic detection, manual info =====
sig User {}

sig Trip {
  owner: one User,
  segs: some Segment
}

sig Detection {
  by:  one User,
  on:  one Segment,
  during:  lone Trip   // 
}

sig Confirmation {
  det:       one Detection,
  confirmer: one User,
  accepted:  one Bool
}

sig ManualInfo {
  author: one User,
  about:  one Segment,
  stated: one Status
}

// ===== 3) Publishability rules =====
pred PublishableDet[d: Detection] {
  some c: Confirmation |
    c.det = d and c.confirmer = d.by and c.accepted = True
}

pred PublishableMI[m: ManualInfo] { some m }   // 手动信息默认可发布

// ===== 4) Voting & Aggregation (多数表决) =====
fun miVotes[s: Segment, st: Status]: Int {
  #( { m: ManualInfo | PublishableMI[m] and m.about = s and m.stated = st } )
}

fun detVotes[s: Segment, st: Status]: Int {
  #( { d: Detection | PublishableDet[d] and d.on = s and st = RequiresMaintenance } )
}

fun votes[s: Segment, st: Status]: Int { miVotes[s,st] + detVotes[s,st] }

pred hasEvidence[s: Segment] {
  some st: Status | votes[s,st] > 0
}

sig AggStatus { map: Segment -> one Status }

fact AggregationRule {
  all s: Segment | let chosen = AggStatus.map[s] |
   (hasEvidence[s]) implies (
 	 votes[s, chosen] > 0 and
 	 all st: Status | votes[s, chosen] >= votes[s, st]
    )
}

// ===== 5) Paths shown to users =====
// 直接用内置序列类型：seq Segment
sig Path { order: seq Segment }

// 连续性 + 非空（用整数索引，无需 util/seq）
fact PathConnectivity {
  all p: Path |
    some p.order.elems and
    all i: p.order.inds |
      // 若 i+1 仍在索引集合里，则第 i 与 i+1 段必须首尾相接
      (i.plus[1] in p.order.inds) implies
        let a = p.order[i], b = p.order[i.plus[1]] |
          a.end = b.start
}

// “安全路径”示意：聚合结果中不含 RequiresMaintenance
pred PathSafe[p: Path] {
  no s: p.order.elems | AggStatus.map[s] = RequiresMaintenance
}

// ===== 6) Sanity =====
fact TripHasSegments { all t: Trip | some t.segs }

// ===== 7) Properties to CHECK =====
assert NoAutoPublishWithoutConfirmation {
  all d: Detection |
    PublishableDet[d] iff
      (some c: Confirmation | c.det = d and c.confirmer = d.by and c.accepted = True)
}

assert PathSegmentsAreAdjacent {
  all p: Path |
    all i: p.order.inds |
      (i.plus[1] in p.order.inds) implies
        let a = p.order[i], b = p.order[i.plus[1]] |
          a.end = b.start
}

assert OnlyDetectionsImplyRM {
  all s: Segment |
    (votes[s, RequiresMaintenance] > 0 and
     all st: Status - RequiresMaintenance | votes[s, st] = 0)
    implies AggStatus.map[s] = RequiresMaintenance
}

assert AggregationRespectsEvidence {
  all s: Segment | (hasEvidence[s]) implies votes[s, AggStatus.map[s]] > 0
}

// ===== 8) Runs for screenshots =====
pred SmallDemo {
  #Node >= 3 and #Segment >= 3 and some Path and some Trip
  some p: Path | #p.order.elems >= 2
}

pred DemoPublishableDetection {
  some d: Detection | PublishableDet[d]
}

pred DemoFusion {
  some s: Segment |
    some st1, st2: Status | st1 != st2 and votes[s, st1] > 0 and votes[s, st2] > 0
}

run SmallDemo for 7 but 4 Node, 5 Segment, 2 Path, 3 User, 2 Trip, 5 Detection, 5 Confirmation, 4 ManualInfo, 1 AggStatus
run DemoPublishableDetection for 7 but 4 Node, 5 Segment, 1 Path, 3 User, 1 Trip, 2 Detection, 2 Confirmation, 0 ManualInfo, 1 AggStatus
run DemoFusion for 8 but 4 Node, 6 Segment, 1 Path, 4 User, 2 Trip, 4 Detection, 4 Confirmation, 4 ManualInfo, 1 AggStatus

check NoAutoPublishWithoutConfirmation for 6 but 4 Node, 6 Segment, 2 Path, 4 User, 3 Trip, 6 Detection, 6 Confirmation, 4 ManualInfo, 1 AggStatus
check PathSegmentsAreAdjacent for 5 but 4 Node, 6 Segment, 2 Path
check OnlyDetectionsImplyRM for 6 but 4 Node, 6 Segment, 2 Path, 4 User, 3 Trip, 6 Detection, 6 Confirmation, 0 ManualInfo, 1 AggStatus
check AggregationRespectsEvidence for 6 but 4 Node, 6 Segment, 2 Path, 4 User, 3 Trip, 4 Detection, 4 Confirmation, 4 ManualInfo, 1 AggStatus
