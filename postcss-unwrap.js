module.exports = () => {
    return {
        postcssPlugin: 'postcss-unwrap-layers',
        AtRule: {
            layer(atRule) {
                // Tailwind 4 wraps everything in @layer. 
                // We unwrap them so older browsers can see the styles.
                if (atRule.nodes && atRule.nodes.length > 0) {
                    atRule.replaceWith(atRule.nodes);
                } else {
                    atRule.remove();
                }
            },
        },
    };
};
module.exports.postcss = true;
