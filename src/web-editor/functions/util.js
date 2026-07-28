// Shared helpers: DOM lookup, escaping, formatting, bridge API access.
export const $ = (s) => document.querySelector(s);

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const fmtSigned = (v) => (v > 0 ? "+" : "") + v;

export async function api(path, opts) {
    const r = await fetch(path, opts);
    if (!r.ok) {
        let msg = r.statusText;
        try {
            msg = (await r.json()).error || msg;
        } catch {
            /* binary/none */
        }
        throw new Error(msg);
    }
    return r;
}
export const apiJson = async (path, opts) => (await api(path, opts)).json();

// localStorage wrappers — persistence is best-effort: private-mode, a disabled
// store, or a quota error must never throw into the caller. lsGet returns the
// fallback when the key is missing OR storage is unavailable; lsSet is a no-op
// on failure.
export function lsGet(key, fallback = null) {
    try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v;
    } catch {
        return fallback;
    }
}
export function lsSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* ignore */
    }
}

// opts for a JSON POST — pass to api() (raw response) or apiJson() (parsed),
// whichever the caller needs. Centralises the method + Content-Type + stringify.
export const jsonBody = (data) => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
});

// styled replacement for window.confirm — a themed <dialog>, returns a
// Promise<boolean> (native dialog gives focus-trap + Esc-to-cancel for free).
export function confirmDialog(title, body, okLabel = "OK") {
    const dlg = $("#confirm-dialog");
    $("#confirm-title").textContent = title;
    $("#confirm-body").textContent = body;
    $("#confirm-ok .hw-btn-cap").textContent = okLabel;
    return new Promise((resolve) => {
        dlg.onclose = () => resolve(dlg.returnValue === "ok");
        dlg.showModal();
    });
}

export function wavFormat(arrayBuf) {
    // minimal RIFF/WAVE fmt reader (LE): channels @22, rate @24
    const dv = new DataView(arrayBuf);
    if (dv.getUint32(0, false) !== 0x52494646) return null; // 'RIFF'
    return { channels: dv.getUint16(22, true), rate: dv.getUint32(24, true) };
}
