# Mini-Program Pre-Submission Checklist

## Purpose

Use this checklist after production environment variables and WeChat platform settings are configured. The backend automated baseline already passed; this checklist verifies mini-program runtime behavior in WeChat DevTools and the target production-like API environment.

## Environment Gate

- [ ] Confirm `miniprogram/config/env.js` points production API traffic to `https://api.woyai.cn/api/v1`.
- [ ] Confirm WeChat mini-program AppID is `wxb22908624ec860fe`.
- [ ] Confirm WeChat public platform request domain includes `https://api.woyai.cn`.
- [ ] Confirm backend production has a strong `JWT_SECRET`.
- [ ] Confirm backend production has `WECHAT_APPID` and `WECHAT_APP_SECRET`.
- [ ] Confirm HTTPS certificate and API gateway are healthy for `https://api.woyai.cn`.

## Backend Smoke Gate

Run these checks against the production-like backend before opening WeChat DevTools:

```bash
# Health check
curl -i https://api.woyai.cn/health

# API health check
curl -i https://api.woyai.cn/api/v1/health
```

- [ ] Health endpoint returns HTTP 200.
- [ ] API health endpoint returns HTTP 200.
- [ ] Backend logs show production JWT secret warning is absent.
- [ ] Backend logs show CORS allows the configured mini-program/API domain path.

## WeChat Login

- [ ] Launch mini-program in WeChat DevTools using AppID `wxb22908624ec860fe`.
- [ ] Clear cache and storage before first run.
- [ ] Complete login flow.
- [ ] Verify `/auth/login` returns a token and user profile.
- [ ] Verify token refresh keeps the user signed in after reopening the mini-program.
- [ ] Verify account deletion entry is visible only in the intended settings/privacy path.

## Child Profiles

- [ ] Create a child profile with valid name, gender, birthday, height, and weight.
- [ ] Edit the child profile and verify updated values persist after page reload.
- [ ] Set a child as default and verify home page uses the default child.
- [ ] Delete a non-default child and verify it disappears from the child list.
- [ ] Attempt core pages with no child profile and verify the user sees a clear setup prompt.

## Nutrition

- [ ] Open nutrition recommendations with a default child selected.
- [ ] Verify recipe list loads and empty states are friendly when no recipe matches.
- [ ] Open a recipe detail page.
- [ ] Favorite and unfavorite a recipe.
- [ ] Reopen recipe detail and verify favorite state persists correctly.

## Parenting Content

- [ ] Open parenting article list.
- [ ] Search by a common keyword and verify results render.
- [ ] Open article detail.
- [ ] Verify related articles load without blocking the detail page.
- [ ] Favorite and unfavorite an article.
- [ ] Verify hot keywords page or module loads correctly.

## Assessments

- [ ] Start an assessment from the mini-program assessment entry.
- [ ] Answer all questions and submit.
- [ ] Verify result page displays score, level, and recommendations.
- [ ] Open assessment history and verify the new record appears.
- [ ] Verify history count displays correctly.
- [ ] Delete an assessment record and verify it disappears from history.

## Textbook Knowledge

- [ ] Open textbook knowledge chapter list.
- [ ] Open a knowledge detail page.
- [ ] Mark progress or complete a task where supported by UI.
- [ ] Reopen the same chapter and verify progress persists.
- [ ] Verify empty/error states do not block returning to the previous page.

## Membership And Payment

- [ ] Confirm membership page is visible when `showMembership` is enabled.
- [ ] Confirm WeChat Pay purchase button is disabled or shows a configuration unavailable state while `enableWechatPay` is false.
- [ ] Confirm backend payment endpoints return `WECHAT_PAY_NOT_CONFIGURED` before real merchant configuration is complete.
- [ ] Enable real payment only after merchant certificate paths, notify URL, and callback verification pass.
- [ ] After enabling payment, place one sandbox or low-value transaction and verify membership status updates after callback.

## AI Chat

- [ ] Open chat page with AI provider unconfigured.
- [ ] Send a childcare question.
- [ ] Verify response uses knowledge fallback messaging and does not present the answer as real AI provider output.
- [ ] Configure real AI provider in a staging environment.
- [ ] Verify chat response metadata changes from fallback to provider output.
- [ ] Verify timeout or provider failure still returns a user-friendly fallback response.

## Privacy And Compliance

- [ ] Open privacy policy page.
- [ ] Open user agreement page.
- [ ] Verify the login flow references agreement/privacy acceptance where required.
- [ ] Verify account deletion path and wording meet WeChat audit expectations.
- [ ] Verify no debug logs expose tokens, openid, phone numbers, or child personal data in DevTools console.

## Cross-Device Checks

- [ ] Test iPhone simulator layout in WeChat DevTools.
- [ ] Test Android simulator layout in WeChat DevTools.
- [ ] Test network failure mode by disabling network and reopening key pages.
- [ ] Test cold start from home page.
- [ ] Test navigation back from detail pages.

## Submission Gate

- [ ] All checklist items above are complete or documented with accepted risk.
- [ ] Backend automated regression remains green after production configuration changes.
- [ ] WeChat platform domains are configured and verified.
- [ ] Real payment remains disabled unless merchant callback verification is complete.
- [ ] Final mini-program upload uses the production environment configuration.
- [ ] Submission notes include AI fallback behavior and payment availability state if those features remain gated.

## Evidence To Keep

- WeChat DevTools screenshots for login, child profile, assessment result, textbook knowledge, membership, chat fallback, privacy policy, and account deletion.
- Backend regression command and output.
- Backend deployment version or Git commit hash.
- Payment configuration validation record when enabling WeChat Pay.
- AI provider configuration validation record when enabling real AI responses.
