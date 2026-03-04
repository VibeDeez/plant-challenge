# Repo Deep Index - Plant Challenge

Last updated: 2026-03-03

## APP files (25)
- `src/app/(protected)/add/page.tsx` - 603 lines | exports:AddPlantPage | db:circle_member, plant, plant_log
- `src/app/(protected)/circles/[id]/page.tsx` - 928 lines | exports:CircleDetailPage | db:circle, circle_activity, circle_activity_reaction, circle_alltime_score, circle_member, circle_weekly_score
- `src/app/(protected)/circles/[id]/settings/page.tsx` - 473 lines | exports:CircleSettingsPage | db:circle, circle_member
- `src/app/(protected)/circles/create/page.tsx` - 260 lines | exports:CircleCreatePage | db:circle, circle_member
- `src/app/(protected)/circles/page.tsx` - 340 lines | exports:CirclesPage | db:circle_member, circle_weekly_score, rpc:join_circle
- `src/app/(protected)/join/[code]/page.tsx` - 105 lines | exports:JoinCirclePage | db:rpc:join_circle
- `src/app/(protected)/layout.tsx` - 10 lines | exports:ProtectedGroupLayout
- `src/app/(protected)/learn/page.tsx` - 702 lines | exports:LearnPage
- `src/app/(protected)/page.tsx` - 397 lines | exports:HomePage | db:circle_member, plant, plant_log
- `src/app/(protected)/profile/page.tsx` - 333 lines | exports:ProfilePage | db:member
- `src/app/(protected)/profile/privacy/page.tsx` - 215 lines | exports:PrivacyPage
- `src/app/(protected)/profile/security/change-email/page.tsx` - 116 lines | exports:ChangeEmailPage
- `src/app/(protected)/profile/security/page.tsx` - 259 lines | exports:SecuritySettingsPage
- `src/app/(protected)/profile/security/sessions/page.tsx` - 201 lines | exports:SessionSettingsPage
- `src/app/(protected)/sage/page.tsx` - 123 lines | exports:SagePage | db:plant_log
- `src/app/apple-icon.tsx` - 41 lines | exports:size, contentType
- `src/app/auth/callback/redirect.test.mjs` - 30 lines
- `src/app/auth/callback/redirect.ts` - 39 lines | exports:sanitizeRedirectPath
- `src/app/auth/callback/route.ts` - 34 lines | methods:GET | exports:GET
- `src/app/auth/page.tsx` - 710 lines | exports:AuthPage
- `src/app/auth/reset-password/page.tsx` - 137 lines | exports:ResetPasswordPage
- `src/app/icon.tsx` - 40 lines | exports:size, contentType
- `src/app/layout.tsx` - 71 lines | exports:RootLayout, metadata, viewport | env:NEXT_PUBLIC_SITE_URL
- `src/app/manifest.ts` - 27 lines | exports:manifest
- `src/app/opengraph-image.tsx` - 57 lines | exports:alt, size, contentType

## API files (14)
- `src/app/api/account/delete/route.ts` - 89 lines | methods:POST | exports:POST | db:account_deletion_request
- `src/app/api/account/email-change/request/route.ts` - 113 lines | methods:POST | exports:POST
- `src/app/api/account/export/route.ts` - 120 lines | methods:POST | exports:POST | db:account_export_request, member, plant_log
- `src/app/api/account/password-reset/request/route.ts` - 67 lines | methods:POST | exports:POST
- `src/app/api/account/sessions/revoke/route.ts` - 81 lines | methods:POST | exports:POST
- `src/app/api/account/sessions/route.ts` - 64 lines | methods:GET | exports:GET | db:account_security_event
- `src/app/api/e2e/cleanup/route.ts` - 119 lines | methods:POST | exports:POST | db:circle, circle_member, member, plant_log | env:E2E_TEST, NODE_ENV
- `src/app/api/e2e/login/route.ts` - 33 lines | methods:GET | exports:GET | env:E2E_TEST, E2E_TEST_EMAIL, E2E_TEST_PASSWORD, NODE_ENV
- `src/app/api/recognize/route.ts` - 270 lines | methods:POST | exports:POST | db:plant | env:OPENROUTER_API_KEY
- `src/app/api/sage/menu-max/route.ts` - 695 lines | methods:POST | exports:POST | db:plant | env:OPENROUTER_API_KEY, SAGE_MENU_OPENROUTER_MODEL, SAGE_MENU_TIMEOUT_MS
- `src/app/api/sage/route.test.mjs` - 90 lines
- `src/app/api/sage/route.ts` - 369 lines | methods:POST | exports:POST | env:OPENROUTER_API_KEY, SAGE_DETERMINISTIC_ONLY, SAGE_OPENROUTER_MODEL, SAGE_OPENROUTER_TIMEOUT_MS
- `src/app/api/sage/routeUtils.ts` - 114 lines | exports:parseSageTimeoutMs, getSageRequestLimitError, extractModelMessageContent, makeDeterministicOnlySageFallbackResponse
- `src/app/api/voice-log/route.ts` - 428 lines | methods:POST | exports:POST | env:OPENROUTER_API_KEY, VOICE_OPENROUTER_MODEL, VOICE_OPENROUTER_TIMEOUT_MS

## COMPONENT files (20)
- `src/components/Accordion.tsx` - 43 lines | exports:Accordion
- `src/components/AddKidModal.tsx` - 96 lines | exports:AddKidModal
- `src/components/AddToHomeScreen.tsx` - 110 lines | exports:AddToHomeScreen | env:NODE_ENV
- `src/components/BottomNav.tsx` - 57 lines | exports:BottomNav
- `src/components/CategoryTabs.tsx` - 42 lines | exports:CategoryTabs
- `src/components/GutHealthPopover.tsx` - 79 lines | exports:GutHealthPopover
- `src/components/LeaderboardRow.tsx` - 279 lines | exports:LeaderboardRow
- `src/components/MemberSwitcher.tsx` - 80 lines | exports:MemberSwitcher
- `src/components/PhotoRecognitionModal.tsx` - 342 lines | exports:PhotoRecognitionModal
- `src/components/PlantAvatar.tsx` - 30 lines | exports:PlantAvatar
- `src/components/PlantCard.tsx` - 62 lines | exports:PlantCard
- `src/components/PlantListItem.tsx` - 57 lines | exports:PlantListItem
- `src/components/PlantPicker.tsx` - 32 lines | exports:PlantPicker
- `src/components/ProgressBar.tsx` - 90 lines | exports:ProgressBar
- `src/components/ProtectedLayout.tsx` - 132 lines | exports:ProtectedLayout, useApp | db:member
- `src/components/SageChat.tsx` - 187 lines | exports:SageChat
- `src/components/SageMenuLogReviewSheet.tsx` - 171 lines | exports:SageMenuLogReviewSheet | db:plant_log
- `src/components/SageMenuMax.tsx` - 387 lines | exports:SageMenuMax
- `src/components/VoiceLogModal.tsx` - 831 lines | exports:VoiceLogModal
- `src/components/ui/sheet.tsx` - 61 lines

## LIB files (31)
- `src/lib/account/rateLimit.ts` - 46 lines | exports:checkRateLimit
- `src/lib/account/requestMeta.ts` - 42 lines | exports:getRequestMeta, getRequestOrigin | env:NEXT_PUBLIC_SITE_URL
- `src/lib/account/securityEvents.ts` - 38 lines | exports:logSecurityEvent | db:account_security_event
- `src/lib/ai/menuMaxTypes.ts` - 45 lines | exports:MenuMaxInputMode, MenuMaxContext, MenuMaxRequest, MenuMaxPlant, MenuMaxRecommendation, MenuMaxLogCandidate...
- `src/lib/ai/menuMaxUtils.test.mjs` - 80 lines
- `src/lib/ai/menuMaxUtils.ts` - 129 lines | exports:extractVisibleTextFromHtml, trimSourceText, isValidMenuImageDataUrl, clampConfidence, mergeLogCandidates, MAX_MENU_SOURCE_TEXT_LENGTH
- `src/lib/ai/openRouterPolicy.test.mjs` - 37 lines
- `src/lib/ai/openRouterPolicy.ts` - 73 lines | exports:parseBooleanFlag, fetchWithPolicy, RECOGNIZE_OPENROUTER_POLICY, SAGE_OPENROUTER_POLICY, VOICE_OPENROUTER_POLICY, OpenRouterPolicy
- `src/lib/ai/openrouterClient.ts` - 30 lines | exports:getOpenRouterClient, isOpenRouterAbortError | env:OPENROUTER_API_KEY
- `src/lib/ai/sageRules.test.mjs` - 54 lines
- `src/lib/ai/sageRules.ts` - 229 lines | exports:getSageDeterministicAliases, matchDeterministicSageRule, SageVerdict, SageContext, SageResponse, DeterministicSageResult
- `src/lib/ai/sageSpecies.ts` - 72 lines | exports:normalizeText, hasAlias, normalizeSpeciesName, isDuplicateSpeciesInWeek, SAGE_ALIAS_MAP, SageSpeciesContext
- `src/lib/analytics/events.ts` - 53 lines | exports:trackAnalyticsEvent, buildAnalyticsEvent, ANALYTICS_EVENT_NAMES, AnalyticsEventName, AnalyticsEvent
- `src/lib/api/e2eGuard.test.mjs` - 24 lines
- `src/lib/api/e2eGuard.ts` - 10 lines | exports:isE2ERouteBlocked
- `src/lib/api/errors.ts` - 37 lines | exports:apiError, ApiErrorCode
- `src/lib/api/telemetry.ts` - 44 lines | exports:createApiTelemetry
- `src/lib/circles.test.mjs` - 127 lines | env:NEXT_PUBLIC_SITE_URL
- `src/lib/circles.ts` - 342 lines | exports:generateInviteCode, getShareUrl, isValidCircleId, isValidInviteCode, validateJoinCirclePayload, detectLeaderboardDiscrepancies... | env:NEXT_PUBLIC_SITE_URL
- `src/lib/constants.ts` - 310 lines | exports:getAvatarByKey, getRandomAvatarKey, CATEGORIES, CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_ICONS...
- `src/lib/copy.ts` - 6 lines | exports:DUPLICATE_SPECIES_GUARD_COPY, DUPLICATE_SPECIES_SHORT_COPY
- `src/lib/imageUtils.ts` - 50 lines | exports:compressImage, getApproxDataUrlBytes, MAX_UPLOAD_FILE_BYTES, MAX_IMAGE_DATA_URL_BYTES
- `src/lib/leaderboardGoal.test.mjs` - 29 lines
- `src/lib/leaderboardGoal.ts` - 33 lines | exports:getLeaderboardGoalState, getLeaderboardGoalMeta, WEEKLY_GOAL_POINTS, LeaderboardGoalState
- `src/lib/recognitionReview.test.mjs` - 19 lines
- `src/lib/recognitionReview.ts` - 19 lines | exports:normalizeRecognitionConfidence, getRecognitionConfidenceBucket, requiresConfidenceReview, RECOGNITION_LOW_CONFIDENCE_THRESHOLD, RecognitionConfidenceBucket
- `src/lib/supabase/client.ts` - 9 lines | exports:createClient | env:NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL
- `src/lib/supabase/middleware.ts` - 61 lines | exports:updateSession | env:E2E_TEST, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL
- `src/lib/supabase/server.ts` - 29 lines | exports:createClient | env:NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL
- `src/lib/types/circle.ts` - 69 lines | exports:REACTION_EMOJIS, Circle, CircleMember, CircleWeeklyScore, CircleAlltimeScore, CircleActivity...
- `src/lib/weekUtils.ts` - 45 lines | exports:getWeekStart, getWeekLabel, getWeekDays

## OTHER files (1)
- `src/middleware.ts` - 14 lines | exports:middleware, config

## Cross-cutting extracted references
- Supabase tables/RPC: account_deletion_request, account_export_request, account_security_event, circle, circle_activity, circle_activity_reaction, circle_alltime_score, circle_member, circle_weekly_score, member, plant, plant_log, rpc:join_circle
- Env vars: E2E_TEST, E2E_TEST_EMAIL, E2E_TEST_PASSWORD, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, NODE_ENV, OPENROUTER_API_KEY, SAGE_DETERMINISTIC_ONLY, SAGE_MENU_OPENROUTER_MODEL, SAGE_MENU_TIMEOUT_MS, SAGE_OPENROUTER_MODEL, SAGE_OPENROUTER_TIMEOUT_MS, VOICE_OPENROUTER_MODEL, VOICE_OPENROUTER_TIMEOUT_MS

## Regenerate
- Run: `python3 scripts/refresh-architecture-docs.py`
