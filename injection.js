    // Replacement rule
    const replacements = {
        'document.addEventListener("DOMContentLoaded",startGame,!1);': `
		setTimeout(function() {
			var DOMContentLoaded_event = document.createEvent("Event");
			DOMContentLoaded_event.initEvent("DOMContentLoaded", true, true);
			document.dispatchEvent(DOMContentLoaded_event);
		}, 0);
	`,
        'SliderOption("Render Distance ",2,8,3)': 'SliderOption("Render Distance ",2,24,3)'
    };

    function modifyAndInject(text) {
        for (const [target, replacement] of Object.entries(replacements)) {
            text = text.replaceAll(target, replacement);
        }
        const script = document.createElement("script");
        script.type = "module";
        script.textContent = text;
        document.head.appendChild(script).remove();
    }

    async function interceptScript(src, originalScript) {
        if (originalScript) originalScript.type = 'javascript/blocked';
        const code = await fetch(src).then(res => res.text());
        modifyAndInject(code);
        if (originalScript) originalScript.type = 'module';
    }

    // Observing and intercepting the target script
    const targetURL = "https://miniblox.io/assets/index";
    if (navigator.userAgent.includes("Firefox")) {
        window.addEventListener("beforescriptexecute", e => {
            if (e.target.src.includes(targetURL)) {
                e.preventDefault();
                interceptScript(e.target.src);
            }
        }, false);
    } else {
        new MutationObserver((mutations, observer) => {
            const targetScript = [...mutations].flatMap(m => [...m.addedNodes])
                .find(node => node.tagName === 'SCRIPT' && node.src.includes(targetURL));
            if (targetScript) {
                observer.disconnect();
                interceptScript(targetScript.src, targetScript);
            }
        }).observe(document, { childList: true, subtree: true });
    };
