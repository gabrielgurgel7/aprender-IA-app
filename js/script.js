const form = document.querySelector("#hero__form");
const input = document.querySelector("#hero__input");
const btnForm = document.querySelector("#hero__button");
const outputEl = document.querySelector("#resposta");
const btnDownload = document.querySelector("#btn-download");
const conteudoSection = document.querySelector("#conteudo-section");
const heroStatus = document.querySelector("#hero__status");
const statusText = document.querySelector("#hero__status-text");
const agentPesquisador = document.querySelector("#agent-pesquisador");
const agentVerificador = document.querySelector("#agent-verificador");
const agentRedator = document.querySelector("#agent-redator");
const agentLine1 = document.querySelector("#agent-line-1");
const agentLine2 = document.querySelector("#agent-line-2");
let temaAtual = "";

function setAgentStep(step) {
  const agents = [agentPesquisador, agentVerificador, agentRedator];
  const lines = [agentLine1, agentLine2];
  const labels = [
    "Pesquisando...",
    "Verificando fontes...",
    "Redigindo material...",
  ];

  agents.forEach((a, i) => {
    a.classList.remove("active", "done");
    if (i < step - 1) a.classList.add("done");
    else if (i === step - 1) a.classList.add("active");
  });

  lines.forEach((l, i) => {
    l.classList.toggle("done", i < step - 1);
  });

  statusText.textContent = labels[step - 1] || "Finalizando...";
}

function showStatus() {
  heroStatus.style.display = "flex";
  setAgentStep(1);
}

function hideStatus() {
  heroStatus.style.display = "none";
  [agentPesquisador, agentVerificador, agentRedator].forEach((a) =>
    a.classList.remove("active", "done"),
  );
  [agentLine1, agentLine2].forEach((l) => l.classList.remove("done"));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) {
    alert("O campo está vazio. Tente novamente.");
    return;
  }

  try {
    temaAtual = query;
    btnForm.disabled = true;
    btnForm.textContent = "Analisando...";
    btnForm.classList.remove("clicavel");
    btnForm.classList.add("cursor-bloqueado");

    showStatus();

    const res = await fetch("https://proxy-n8n.gabrielgurgel635.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    const id = data.id;

    await polling(id);
  } catch (error) {
    alert("Erro: " + error.message);
  } finally {
    hideStatus();
    btnForm.disabled = false;
    btnForm.textContent = "Pesquisar";
    btnForm.classList.remove("cursor-bloqueado");
    btnForm.classList.add("clicavel");
    form.reset();
  }
});

async function polling(id) {
  const intervalo = 5000;
  const maxTentativas = 60;

  for (let i = 0; i < maxTentativas; i++) {
    await esperar(intervalo);

    // Avança visualmente: ~20s pesquisando, ~20s verificando, resto redigindo
    if (i < 4) setAgentStep(1);
    else if (i < 8) setAgentStep(2);
    else setAgentStep(3);

    const res = await fetch(
      "https://proxy-n8n.gabrielgurgel635.workers.dev/status",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      },
    );

    const data = await res.json();

    if (data.status === "done") {
      let conteudo = data.conteudo;
      if (typeof conteudo === "string") {
        conteudo = conteudo
          .replace(/^"|"$/g, "")
          .replace(/\\n/g, "")
          .replace(/\\"/g, '"');
      }
      outputEl.innerHTML = conteudo;
      conteudoSection.classList.remove("hidden");
      conteudoSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }

  outputEl.innerHTML = "<p>⏱️ Tempo limite atingido. Tente novamente.</p>";
  conteudoSection.classList.remove("hidden");
  conteudoSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

btnDownload.addEventListener("click", () => {
  window.print();
});
