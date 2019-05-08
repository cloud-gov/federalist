module.exports = `
<html lang="en">
    <head>
        <title>404 Error, Page Not Found</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            #main {
                margin: 12% auto;
            }
            @media (min-width: 1025px) {
                #main {
                    width: 60%;
                }
            }
            @media (max-width: 1025px) {
                #main {
                    width: 75%;
                }
            }
            #title {
                font-size: 40px;
                padding-bottom: 2px;
                border-bottom: 3px solid #205493;
            }
            #federalist-explanation {
                font-style: italic;
            }
            body {
                font-family: "Merriweather", "Georgia", "Cambria", "Times New Roman", "Times", serif;
            }
            p {
                font-size: 1.25em;
                margin: 50px 0 40px 0;
            }
        </style>
    </head>
    <body>
        <div id="main">
            <h1>
                <span id="title">404 / Page not found</span>
            </h1>
            <p>
                You might want to double-check your link and try again, or return to the <a href="/">homepage<a/>.
            </p>
            <p id="federalist-explanation">
                This is a default 404 page for <a href='https://federalist.18f.gov'>Federalist</a>, a hosting service for federal websites.
            </p>
            <svg width="30px" height="30px" viewBox="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <title>Federalist logo (quill inside circle)</title>
                <desc>Created with Sketch.</desc>
                <defs></defs>
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="logo" transform="translate(0.000000, -1.000000)" fill="#2D476A" fill-rule="nonzero">
                        <path d="M16.1,22.9 C16.1,22.9 16.1,22.9 16.1,22.9 C16.3,22.9 16.6,22.8 16.7,22.7 L19.8,19.6 C19.8,19.6 19.8,19.6 19.8,19.6 L22.9,16.5 C22.9,16.5 22.9,16.5 22.9,16.5 L28.3,11.1 C30.6,8.8 30.6,5 28.3,2.7 C26,0.4 22.2,0.4 19.9,2.7 L8.3,14.3 C8.1,14.5 8,14.7 8.1,14.9 L8.2,21.6 L5,24.8 C2.9,22.4 1.7,19.3 1.7,16.1 C1.7,12.6 3.1,9.3 5.6,6.8 C8,4.3 11.3,3 14.9,3 C15.4,3 15.7,2.6 15.7,2.2 C15.7,1.8 15.3,1.4 14.9,1.4 C10.9,1.4 7.2,2.9 4.4,5.8 C1.5,8.4 0,12.2 0,16.1 C0,20.1 1.5,23.8 4.4,26.6 C7.2,29.4 10.9,31 14.9,31 C18.9,31 22.6,29.5 25.4,26.6 C28.2,23.8 29.8,20.1 29.8,16.1 C29.8,15.6 29.4,15.3 29,15.3 C28.5,15.3 28.2,15.7 28.2,16.1 C28.2,19.6 26.8,22.9 24.3,25.4 C21.8,27.9 18.5,29.3 15,29.3 C11.8,29.3 8.7,28.1 6.3,26 L9.5,22.8 L16.1,22.9 Z M15.8,21.2 L11,21.2 L12.5,19.7 L17.2,19.8 L15.8,21.2 Z M15.6,16.6 L20.3,16.7 L18.8,18.2 L14.1,18 L15.6,16.6 Z M9.8,15.2 L21.1,3.9 C22.8,2.2 25.4,2.2 27.1,3.9 C27.9,4.7 28.3,5.8 28.3,6.9 C28.3,8 27.9,9.1 27.1,9.9 L22,15 L17.3,14.9 L21.3,10.9 C21.6,10.6 21.6,10 21.3,9.7 C21,9.4 20.4,9.4 20.1,9.7 L11.6,18.2 L9.8,20 L9.8,15.2 Z" id="Shape"></path>
                    </g>
                </g>
            </svg>
        </div>
    </body>
</html>
`;
