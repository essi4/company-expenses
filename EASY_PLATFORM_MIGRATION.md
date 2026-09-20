# EASY Platform Migration

مخزن `company-expenses` به‌عنوان پایه‌ی کد برای EASY Business Platform در نظر گرفته شده است.

این مرحله فقط روی feature branch انجام شده و main/master هنوز تغییر نکرده است.

## Naming

Application name:
EASY Business Platform

Target repository name:
easy-business-platform

## Safety

Production deployment: NO
Production database changes: NO

Before merge:
1. integrate stages 138-150 implementation workspace
2. run build/lint/integration tests
3. verify staging
4. review PR
5. merge once
6. production deploy once
