new Medium({
    debug: true,
    element: null,
    modifier: 'auto',
    placeholder: "",
    autofocus: false,
    autoHR: true,
    mode: 'rich',
    maxLength: -1,
    modifiers: {
        66: 'bold',
        73: 'italicize',
        85: 'underline',
        86: 'paste'
    },
    tags: {
        paragraph: 'p',
        outerLevel: ['pre','blockquote', 'figure', 'hr'],
        innerLevel: ['a', 'b', 'u', 'i', 'img', 'strong']
    },
    cssClasses: {
        editor: 'Medium',
        pasteHook: 'Medium-paste-hook',
        placeholder: 'Medium-placeholder'
    }
});