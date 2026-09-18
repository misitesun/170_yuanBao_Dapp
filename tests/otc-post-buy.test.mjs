import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { getOtcPostBuyValidation } from '../src/pages/main/otc-post-buy/form.ts'

test('OTC post-buy renders the confirmed static form with native labels and submit semantics', async () => {
    const [source, styles] = await Promise.all([
        readFile('src/pages/main/otc-post-buy/OtcPostBuyPage.tsx', 'utf8'),
        readFile('src/pages/main/otc-post-buy/OtcPostBuyPage.scss', 'utf8'),
    ])

    assert.match(source, /<SecondaryHeader title="发布挂买"/)
    assert.match(source, /HU实时价/)
    assert.match(source, /0\.008842/)
    assert.match(source, /htmlFor="otc-post-buy-price"/)
    assert.match(source, /id="otc-post-buy-price"/)
    assert.match(source, /htmlFor="otc-post-buy-quantity"/)
    assert.match(source, /id="otc-post-buy-quantity"/)
    assert.match(source, /type="submit"/)
    assert.match(source, /输入挂买的数量/)
    assert.match(styles, /--app-input-background: rgb\(255 255 255 \/ 10%\);/)
})

test('OTC post-buy requires both fields without inventing numeric precision rules', () => {
    assert.deepEqual(getOtcPostBuyValidation('', ''), {
        invalidUnitPrice: true,
        invalidQuantity: true,
    })
    assert.deepEqual(getOtcPostBuyValidation('0.0044', ''), {
        invalidUnitPrice: false,
        invalidQuantity: true,
    })
    assert.deepEqual(getOtcPostBuyValidation('0.0044', '12.5'), {
        invalidUnitPrice: false,
        invalidQuantity: false,
    })
})
