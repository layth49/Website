/* ============================================================
   Burhan — TestFlight invite request
   ============================================================

   The site is static: no backend, no form service. So the form
   composes a mail draft and hands it to the visitor's mail app,
   which means their address goes to Layth and to Apple, and to
   nobody in between. That fits a page whose whole pitch is that
   nothing is collected.

   To move this to a real endpoint later, set ENDPOINT to the URL
   (a Cloudflare Worker, Formspree, etc). Everything else below
   already handles that path; the mail draft becomes the fallback
   for when the request fails.
   ============================================================ */

const ENDPOINT = null; // e.g. "https://burhan-invites.<you>.workers.dev"
const INBOX = "laythandamin@gmail.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inviteForm");
  if (!form) return;

  const statusEl = form.querySelector(".bu-form-status");
  const submitBtn = form.querySelector("button[type=submit]");
  const emailEl = form.querySelector("#inv-email");

  const field = (name) => (form.elements[name]?.value || "").trim();

  const setStatus = (msg, kind) => {
    statusEl.textContent = msg;
    statusEl.className = "bu-form-status" + (kind ? " " + kind : "");
  };

  const buildMessage = () => {
    const lines = [
      "I'd like a TestFlight invite for Burhan.",
      "",
      "Email: " + field("email"),
    ];
    if (field("name")) lines.push("Name: " + field("name"));
    if (field("device")) lines.push("Device: " + field("device"));
    if (field("note")) lines.push("", field("note"));
    return lines.join("\n");
  };

  // Swap the form out for a confirmation the visitor can act on.
  const showHandoff = (body) => {
    const done = document.createElement("div");
    done.className = "bu-form-done";
    done.innerHTML =
      '<p class="bu-done-line"><i class="fa-solid fa-envelope-open-text"></i> Your mail app should be opening.</p>' +
      "<p class=\"bu-done-sub\">Send the draft and I'll get you on the build. If nothing opened, copy the message below and mail it to <b>" +
      INBOX +
      "</b> yourself.</p>" +
      '<pre class="bu-done-body"></pre>' +
      '<button type="button" class="btn bu-copy"><i class="fa-regular fa-copy"></i> Copy message</button>';
    done.querySelector(".bu-done-body").textContent = body;
    form.replaceWith(done);

    const copyBtn = done.querySelector(".bu-copy");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(body);
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
      } catch {
        // Clipboard blocked (insecure context, permissions). Select it
        // instead so the visitor can copy by hand.
        const range = document.createRange();
        range.selectNodeContents(done.querySelector(".bu-done-body"));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        copyBtn.innerHTML = '<i class="fa-solid fa-i-cursor"></i> Selected — press Ctrl/Cmd+C';
      }
    });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Apple only needs the address, so that is the only required field.
    if (!emailEl.checkValidity() || !field("email")) {
      emailEl.focus();
      setStatus("Apple needs an email address to send the invite to.", "bad");
      return;
    }

    const body = buildMessage();

    if (ENDPOINT) {
      submitBtn.disabled = true;
      setStatus("Sending…");
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: field("email"),
            name: field("name"),
            device: field("device"),
            note: field("note"),
            website: field("website"), // honeypot; real people leave it empty
          }),
        });
        if (!res.ok) throw new Error(res.status);
        form.replaceWith(
          Object.assign(document.createElement("div"), {
            className: "bu-form-done",
            innerHTML:
              '<p class="bu-done-line"><i class="fa-solid fa-check"></i> Request sent.</p>' +
              '<p class="bu-done-sub">Watch for a TestFlight invite from Apple at that address.</p>',
          })
        );
        return;
      } catch {
        // Fall through to the mail draft rather than losing the request.
        submitBtn.disabled = false;
        setStatus("Couldn't reach the server, opening your mail app instead.", "warn");
      }
    }

    // Render the fallback BEFORE attempting the handoff. Opening a
    // mail client can be blocked (no handler registered, embedded or
    // sandboxed context), and if that throws after the fact the
    // visitor loses everything they typed with nothing to show for it.
    showHandoff(body);

    try {
      window.location.href =
        "mailto:" +
        INBOX +
        "?subject=" +
        encodeURIComponent("Burhan TestFlight invite") +
        "&body=" +
        encodeURIComponent(body);
    } catch {
      // The copy-and-send fallback is already on screen.
    }
  });
});
