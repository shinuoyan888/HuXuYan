// BBP app.js v2 - FINAL
// app/static/app.js
// Works with index.html that uses button IDs (btn_xxx) and input IDs.
// Output panel: <pre id="out"></pre>

(function () {
  const out = document.getElementById("out");

  function show(obj) {
    if (!out) return;
    out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  }

  async function api(method, url, body = null) {
    const opts = { method, headers: {} };
    if (body !== null) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = typeof data === "string" ? data : JSON.stringify(data);
      throw new Error(msg || `HTTP ${res.status}`);
    }
    return data;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function val(id) {
    const el = $(id);
    return el ? el.value : "";
  }

  function intVal(id) {
    const x = parseInt(val(id), 10);
    return Number.isNaN(x) ? null : x;
  }

  function floatVal(id) {
    const x = parseFloat(val(id));
    return Number.isNaN(x) ? null : x;
  }

  // ---------- Leaflet Map ----------
  // 你在 index.html 里已经创建了 map，并且 window.__map = map
  // 所以这里优先复用 window.__map；如果没有，再尝试自己 init（兼容）
  let map = null;
  let routeLine = null;
  let fromMarker = null;
  let toMarker = null;

  function getMap() {
    if (map) return map;
    if (window.__map) {
      map = window.__map;
      return map;
    }
    // 兼容：如果 index.html 没创建 map，这里自己创建
    const mapDiv = $("map");
    if (!mapDiv) return null;
    if (typeof window.L === "undefined") return null;

    map = window.L.map("map").setView([1.3521, 103.8198], 12);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    return map;
  }

  function clearMapLayers() {
    const m = getMap();
    if (!m || typeof window.L === "undefined") return;

    if (routeLine) {
      m.removeLayer(routeLine);
      routeLine = null;
    }
    if (fromMarker) {
      m.removeLayer(fromMarker);
      fromMarker = null;
    }
    if (toMarker) {
      m.removeLayer(toMarker);
      toMarker = null;
    }
  }

  // 支持两种画法：
  // 1) 如果后端返回 geometry.coordinates（OSRM geojson），就画真实路线
  // 2) 否则画直线（至少地图上有展示）
  function drawTripOnMap(fromLat, fromLon, toLat, toLon, tripData = null) {
    const m = getMap();
    if (!m || typeof window.L === "undefined") return;

    clearMapLayers();

    const from = [fromLat, fromLon];
    const to = [toLat, toLon];

    fromMarker = window.L.marker(from).addTo(m).bindPopup("From").openPopup();
    toMarker = window.L.marker(to).addTo(m).bindPopup("To");

    let latlngs = null;

    // 若后端给了 geometry（GeoJSON：coordinates 是 [lon,lat]）
    const coords = tripData?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length > 1) {
      latlngs = coords.map(([lon, lat]) => [lat, lon]);
    } else {
      // 没 geometry：画直线
      latlngs = [from, to];
    }

    routeLine = window.L.polyline(latlngs).addTo(m);
    m.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
  }

  // ---------- Segment helpers ----------
  function getSelectedSegmentId() {
    const sel = $("segmentSelect");
    if (!sel) throw new Error("页面缺少 segmentSelect 下拉框");
    const v = sel.value;
    if (!v) throw new Error("请先 Load Segments 并选择一个 segment");
    const id = parseInt(v, 10);
    if (Number.isNaN(id)) throw new Error("segmentSelect 的值不是数字");
    return id;
  }

  function setSelectOptions(selectEl, items) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    items.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = String(s.id);
      opt.textContent = `#${s.id} user=${s.user_id} status=${s.status}`;
      selectEl.appendChild(opt);
    });
  }

  // ---------- Bind buttons ----------
  function bind() {
    // Clear
    const btnClear = $("btn_clear");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        show("Ready.");
        // 不强制清地图，你想清也可以：
        // clearMapLayers();
      });
    }

    // Create/Get User
    const btnCreateUser = $("btn_create_user");
    if (btnCreateUser) {
      btnCreateUser.addEventListener("click", async () => {
        try {
          const username = (val("u_name") || "").trim();
          if (!username) return show("请输入用户名（u_name）");
          const data = await api("POST", "/api/users", { username });
          show(data);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }

    // Create Segment
    const btnCreateSegment = $("btn_create_segment");
    if (btnCreateSegment) {
      btnCreateSegment.addEventListener("click", async () => {
        try {
          const userId = intVal("userId");
          if (userId === null) return show("user_id 必须是数字（userId）");

          const statusEl = $("status");
          const status = statusEl ? statusEl.value : "optimal";
          const obstacle = (val("obstacle") || "").trim() || null;

          const data = await api("POST", "/api/segments", {
            user_id: userId,
            status,
            obstacle,
          });
          show(data);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }

    // Load Segments
    const btnLoadSegments = $("btn_load_segments");
    if (btnLoadSegments) {
      btnLoadSegments.addEventListener("click", async () => {
        try {
          const segs = await api("GET", "/api/segments");
          setSelectOptions($("segmentSelect"), segs);
          show(segs);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }

    // Create Report
    const btnCreateReport = $("btn_create_report");
    if (btnCreateReport) {
      btnCreateReport.addEventListener("click", async () => {
        try {
          const segmentId = getSelectedSegmentId();
          const note = (val("reportNote") || "").trim() || null;
          const data = await api("POST", `/api/segments/${segmentId}/reports`, { note });
          show(data);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }

    // Load Reports
    const btnLoadReports = $("btn_load_reports");
    if (btnLoadReports) {
      btnLoadReports.addEventListener("click", async () => {
        try {
          const segmentId = getSelectedSegmentId();
          const data = await api("GET", `/api/segments/${segmentId}/reports`);
          show(data);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }

    // Confirm Report
    const btnConfirmReport = $("btn_confirm_report");
    if (btnConfirmReport) {
      btnConfirmReport.addEventListener("click", async () => {
        try {
          const rid = intVal("confirmReportId");
          if (rid === null) return show("report_id 必须是数字（confirmReportId）");
          const data = await api("POST", `/api/reports/${rid}/confirm`);
          show(data);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }

    // Aggregate
    const btnAgg = $("btn_aggregate");
    if (btnAgg) {
      btnAgg.addEventListener("click", async () => {
        try {
          const segmentId = getSelectedSegmentId();
          const data = await api("GET", `/api/segments/${segmentId}/aggregate`);
          show(data);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }

    // Trip / Route Query
    const btnTrip = $("btn_trip");
    if (btnTrip) {
      btnTrip.addEventListener("click", async () => {
        try {
          const user_id = intVal("tripUserId");
          const from_lat = floatVal("fromLat");
          const from_lon = floatVal("fromLon");
          const to_lat = floatVal("toLat");
          const to_lon = floatVal("toLon");

          if ([user_id, from_lat, from_lon, to_lat, to_lon].some((x) => x === null)) {
            return show("Trip 参数必须都是数字：tripUserId/fromLat/fromLon/toLat/toLon");
          }

          show("计算中...");

          const data = await api("POST", "/api/trips", {
            user_id,
            from_lat,
            from_lon,
            to_lat,
            to_lon,
          });

          // 画路线（有 geometry 就画真实路线；没就画直线）
          drawTripOnMap(from_lat, from_lon, to_lat, to_lon, data);

          show(data);
        } catch (e) {
          show("错误: " + (e?.message || String(e)));
        }
      });
    }
  }

  // ---------- Start ----------
  document.addEventListener("DOMContentLoaded", () => {
    bind();
    if (out && !out.textContent) show("Ready.");
  });
})();


