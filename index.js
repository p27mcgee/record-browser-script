import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();

    await context._enableRecorder({
        mode: 'recording',
        outputFile: 'jeff.txt',
        handleSIGINT: false,
        target: 'javascript',
    });

    const page = await context.newPage();

    let currentState = {
        message: 'Navigate to the login page',
        buttonText: 'Login Page Confirmed'
    };

    await page.exposeFunction('updateState', async (newState) => {
        currentState = newState;
        await createOrUpdateFloatingWindow();
    });

    await page.exposeFunction('endProgram', async () => {
        await browser.close();
        process.exit(0);
    });

    const createOrUpdateFloatingWindow = async () => {
        await page.evaluate(({ message, buttonText }) => {
            const controlPanelId = 'floatingControls';

            let controls = document.getElementById(controlPanelId);
            if (controls) {
                controls.remove();
            }

            controls = document.createElement('div');
            controls.id = controlPanelId;
            controls.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                width: 300px;
                background-color: white;
                border: 2px solid #007bff; // Blue border
                box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                z-index: 1000;
            `;

            const titleBar = document.createElement('div');
            titleBar.textContent = 'Contrast Authentication Recorder';
            titleBar.style.cssText = `
                font-weight: bold;
                background-color: #007bff;
                color: white;
                padding: 5px;
                text-align: center;
                border-bottom: 1px solid #0056b3;
            `;

            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            messageElement.style.cssText = 'margin: 10px;';

            const button = document.createElement('button');
            button.textContent = buttonText;

            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = 'text-align: center; padding-bottom: 10px;';
            buttonContainer.appendChild(button);

            controls.appendChild(titleBar);
            controls.appendChild(messageElement);
            controls.appendChild(buttonContainer);

            document.body.appendChild(controls);

            function dragElement(elmnt) {
                var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
                elmnt.onmousedown = dragMouseDown;

                function dragMouseDown(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    document.onmouseup = closeDragElement;
                    document.onmousemove = elementDrag;
                }

                function elementDrag(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
                }

                function closeDragElement() {
                    document.onmouseup = null;
                    document.onmousemove = null;
                }
            }

            //  dragElement(controls);

            button.addEventListener('click', () => {
                let newState;
                switch (button.textContent) {
                    case 'Login Page Confirmed':
                        newState = {
                            message: 'Complete Authentication',
                            buttonText: 'Authentication Confirmed'
                        };
                        break;
                    case 'Authentication Confirmed':
                        newState = {
                            message: 'Select something that indicates you are logged in',
                            buttonText: 'Authenticated Indicator Confirmed'
                        };
                        break;
                    case 'Authenticated Indicator Confirmed':
                        newState = {
                            message: 'Logout, then select something that indicates you are logged out',
                            buttonText: 'Unauthenticated Indicator Confirmed'
                        };
                        break;
                    case 'Unauthenticated Indicator Confirmed':
                        newState = {
                            message: 'Save and exit',
                            buttonText: 'Done'
                        };
                        break;
                    case 'Done':
                        window.endProgram();
                        return;
                }
                window.updateState(newState);
            });
        }, currentState);
    };

    const injectFloatingWindow = () => {
        page.waitForLoadState('load').then(() => {
            page.waitForTimeout(2000).then(createOrUpdateFloatingWindow);
        });
    };

    page.on('load', injectFloatingWindow);

    await page.goto('https://eval.contrastsecurity.com');
    await injectFloatingWindow();

})();

