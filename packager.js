// a NODE.JS script for packaging .mts files into .html files + packaging other files (aslo compiles all typescript files to javascript files)
// (result is in dist folder)
// A node.js api
function _build(pth, dist) {
    const fs = require('fs');
    const path = require('path');
    const ts = require('typescript');

    // To Make development easier, we converting function to string, and slicing () => {}.
    const code = (() => {
        const Maciko = {
            createElement: function (tag, attributes, ...children) {
                const element = document.createElement(tag);
                for (let key in attributes) {
                    if (key === 'style') {
                        Object.assign(element.style, attributes[key]);
                    } else {
                        element.setAttribute(key, attributes[key]);
                    }
                }
                for (let child of children) {
                    if (typeof child === 'string') {
                        child = document.createTextNode(child);
                    }
                    element.appendChild(child);
                }
                return element;
            },
            Setup: function (title, ...elements) {
                var titleNode = document.createElement("title");
                titleNode.innerText = title;
                document.head.appendChild(titleNode);
                for (let element of elements) {
                    if (typeof element === 'string') {
                        element = document.createTextNode(element);
                    }
                    document.body.appendChild(element);
                }
            },
            propToId: function (id, props) {
                var element = document.getElementById(id);
                for (let key in props) {
                    if (key === 'style') {
                        Object.assign(element.style, props[key]);
                    }
                    else element.setAttribute(key, props[key]);
                }
                return element;
            },
            propToClass: function (clas, props) {
                const elements = document.getElementsByClassName(clas);
                for (let element of elements) {
                    for (let key in props) {
                        if (key === 'style') {
                            Object.assign(element.style, props[key]);
                        }
                        else element.setAttribute(key, props[key]);
                    }
                }
                return elements;
            },
            propToElement: function (elem, props) {
                const elements = document.getElementsByTagName(elem);
                for (let element of elements) {
                    for (let key in props) {
                        if (key === 'style') {
                            Object.assign(element.style, props[key]);
                        }
                        else element.setAttribute(key, props[key]);
                    }
                }
                return elements;
            },
            CSS: function (css) {
                const element = document.createElement('style');
                element.type = 'text/css';
                element.innerHTML = css;
                document.head.appendChild(element);
            },
            elements: {

                form: {
                    Button: (isSubmit, ...text) => Maciko.createElement(isSubmit ? "input" : "button", { type: isSubmit ? "submit" : undefined }, ...text),
                    Form: (post, ...children) => Maciko.createElement("form", { method: "post", action: post }, ...children),
                    FieldSet: (legend, ...children) => Maciko.createElement("fieldset", {}, Maciko.createElement("legend", {}, legend), ...children),
                    Input: (type, name, value) => Maciko.createElement("input", { type: type, name: name, value: value })
                },

                Img: (url, title) => Maciko.createElement("img", { src: url, title: title ?? "" }),
                Link: (url, title) => Maciko.createElement("a", { href: url }, title ?? ""),
                Br: () => Maciko.createElement("br", {}),
                H: (level, text) => Maciko.createElement("h" + level.toString(), {}, text),
                P: (...text) => Maciko.createElement("p", {}, ...text),
                List: function(mode, ...elements) {
                    let elementName = mode;
                    let children = [];
                    elements.forEach(function(element) {
                        children.push(Maciko.createElement("li", {}, element));
                    });
                    if(elementName == "ordered") elementName = "ol";
                    if(elementName == "unordered") elementName = "ul";
                    if(!(["ol", "ul"].includes(elementName))) throw new Error("Unsupported element type for list.");
                    return Maciko.createElement(elementName, {}, children);
                },
                media: {
                    yt: (id, width, height) => Maciko.createElement("iframe", {
                        width: width ?? 560,
                        height: height ?? 315,
                        frameborder: 0,
                        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                        allowfullscreen: true,
                        src: `https://www.youtube.com/embed/${id}`
                    })
                }
            }
        }
    }).toString().slice(7, -2);

    function compileMtsToTs(srcDir, distDir) {
        const files = fs.readdirSync(srcDir);

        for (let file of files) {
            const srcFilePath = path.join(srcDir, file);
            const distFilePath = path.join(distDir, file);

            if (fs.statSync(srcFilePath).isDirectory()) {
                if (!fs.existsSync(distFilePath)) {
                    fs.mkdirSync(distFilePath);
                }
                compileMtsToTs(srcFilePath, distFilePath);
            } else if (path.extname(srcFilePath) === '.mts') {
                let content = fs.readFileSync(srcFilePath, 'utf8');
                content = content.replace(/\/\/\/Start[\s\S]*?\/\/\/End/gi, '');
                content = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.ES2015 } }).outputText;
                content = `
<!DOCTYPE html>
<!-- MADE USING Maciko.TS framework -->
<script>
${code}
</script>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body></body>
    <script type="module">
        ${content}
    </script>
</html>`;
                const htmlFilePath = path.join(path.dirname(distFilePath), path.basename(distFilePath, '.mts') + '.html');
                fs.writeFileSync(htmlFilePath, content);
            } else if (path.extname(srcFilePath) === '.ts') {
                // Build the source
                let content = fs.readFileSync(srcFilePath, 'utf8');
                content = content.replace(/\/\/\/Start[\s\S]*?\/\/\/End/gi, '');
                content = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.ES2015 } }).outputText;

                // Write source to .js file
                const jsFilePath = path.join(path.dirname(distFilePath), path.basename(distFilePath, '.ts') + '.js');
                fs.writeFileSync(jsFilePath, content);
            } else {
                fs.copyFileSync(srcFilePath, distFilePath);
            }
        }
    }


    const distDir = path.join(process.cwd(), dist);
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    compileMtsToTs(pth, distDir);
}


module.exports = {
    /**
     * Gives an object that can be used to build your project.
     * @param {string} path Path to source code directory. 
     */
    build(path) {
        return {
            /**
             * Builds the project
             * @param {string} distdir Dist Directory. 
             */
            to(distdir) {
                _build(path, distdir);
            }
        }
    }
}