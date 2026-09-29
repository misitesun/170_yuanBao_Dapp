// Existing behavior tests run in Chinese; keep interpolation semantics in the IO stub.
export const testTranslation = (key, values = {}) => key.replace(/{{(\w+)}}/g, (_, name) => String(values[name] ?? `{{${name}}}`))

export const i18nRuntime = {
    useTranslation: () => ({ t: testTranslation, i18n: { language: 'zh-Hans' } }),
    Trans: ({ i18nKey, values }) => testTranslation(i18nKey, values).replace(/<\/?\d+>/g, ''),
}
