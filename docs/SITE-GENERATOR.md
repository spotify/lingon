# Experimental Static site features

Lingon includes some experimental features to make it more of a "static site generator", usch as Middleman. These features are alpha and will be moved to their own project (as a Lingon plugin).

# Render templates inside layouts

EJS does not support layouts, so this feature has been added natively to Lingon. Lingon supports templates when using `ejs`, `html` or `md` documents. It's possible to mix them, for instance: a Markdown document can be rendered inside a html template.

**Limitation:** Layouts can't be rendered inside other layouts.

## Render a simple html layout

Let's render a homepage template inside an index layout.

This example has the following structure:

```
lingon.js
source
  _layouts
    index.html
  home.html
```

#### File: source/_layouts/index.html

The layout is a regular html file that defines an inline lingon yield directive. The yield directive will be replaced with the contents of the template.

**important: It needs to be on it's own line.**

```html
<html>
  <head></head>
  <body>
    <!-- lingon: yield -->
  </body>
</html>
```

#### File: source/home.html

The template uses a lingon layout directive to define a template to render inside. The path to the template can be either relative from the template file or absolute from the lingon sourcePath.

```html
<!-- lingon: layout '_layouts/index.ejs' -->
<h1>Welcome</h1>
<p>This is a website.</p>
```

## Render a md file inside a html template

Easy! Follow the above example, but change the home.html template to a Markdown document.

**File: source/home.md**

```markdown
<!-- lingon: layout '_layouts/index.ejs' -->
# Welcome

This is a website.
```