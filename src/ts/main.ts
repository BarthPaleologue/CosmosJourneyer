async function fetchHtml(path: string) {
    return await fetch(new URL(path, import.meta.url)).then((res) => res.text());
}

async function loadHtml() {
    const bodyEditor = await fetchHtml("/src/html/bodyEditor.html");
    const spaceStationUI = await fetchHtml("/src/html/spaceStationUI.html");
    const helmetOverlay = await fetchHtml("/src/html/helmetOverlay.html");
    const mainMenu = await fetchHtml("/src/html/mainMenu.html");
    const pauseMenu = await fetchHtml("/src/html/pauseMenu.html");
    const sidePanels = await fetchHtml("/src/html/sidePanels.html");

    document.body.insertAdjacentHTML("beforeend", bodyEditor);
    document.body.insertAdjacentHTML("beforeend", spaceStationUI);
    document.body.insertAdjacentHTML("beforeend", helmetOverlay);
    document.body.insertAdjacentHTML("beforeend", mainMenu);
    document.body.insertAdjacentHTML("beforeend", pauseMenu);
    document.body.insertAdjacentHTML("beforeend", sidePanels);
}

void loadHtml();
