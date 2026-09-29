import assert from 'node:assert/strict'
import test from 'node:test'
import { runtime } from './helpers/yuanbao-runtime.mjs'

function invitationRuntime(origin, pathname = '/h5/team') {
    return runtime({
        'src/router/config.ts': { APP_HOME_ROUTE_NAME: 'home', APP_ROUTE_BASE: '/h5/' },
    }, { window: { location: { origin, pathname } } })('src/features/auth/referral.ts')
}

test('invitations use the root ref entry even when the app page is under h5', () => {
    const { buildInvitationLink } = invitationRuntime('http://192.168.110.83:5175')
    assert.equal(buildInvitationLink('Oa0y507g'), 'http://192.168.110.83:5175/ref/Oa0y507g')
})

test('invitations follow the current site origin and encode the referral path segment', () => {
    const { buildInvitationLink } = invitationRuntime('https://example.test')
    assert.equal(buildInvitationLink('abc12345'), 'https://example.test/ref/abc12345')
    assert.equal(buildInvitationLink('a/b?c#d'), 'https://example.test/ref/a%2Fb%3Fc%23d')
})

test('missing invitation codes and non-browser rendering keep invitation links empty', () => {
    assert.equal(invitationRuntime('https://example.test').buildInvitationLink(''), '')
    const { buildInvitationLink } = runtime({
        'src/router/config.ts': { APP_HOME_ROUTE_NAME: 'home' },
    })('src/features/auth/referral.ts')
    assert.equal(buildInvitationLink('Oa0y507g'), '')
})
