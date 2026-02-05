#!/usr/bin/env bash
set -euo pipefail

API_BASE="${NEXT_PUBLIC_API_URL:-https://omnisurvey.servicesmanagement.us/api/v1}"
EMAIL="${SEED_EMAIL:-supervisor@example.com}"
PASSWORD="${SEED_PASSWORD:-password}"
SURVEY_NAME="${SURVEY_NAME:-BRAC Bank Customer Feedback Form}"
FORCE_SEED="${FORCE_SEED:-0}"
CREATE_CAMPAIGN="${CREATE_CAMPAIGN:-1}"
CAMPAIGN_NAME="${CAMPAIGN_NAME:-${SURVEY_NAME} Campaign}"
CAMPAIGN_DESC="${CAMPAIGN_DESC:-Auto-created campaign for ${SURVEY_NAME}}"
CAMPAIGN_ASSIGNMENT_MODE="${CAMPAIGN_ASSIGNMENT_MODE:-manual}"
CAMPAIGN_FORCE_SEED="${CAMPAIGN_FORCE_SEED:-$FORCE_SEED}"

json_get() {
  python3 -c 'import json,sys
path=sys.argv[1]
obj=json.load(sys.stdin)
cur=obj
for part in path.split("."):
  if isinstance(cur, list):
    try:
      cur=cur[int(part)]
    except Exception:
      cur=None
      break
  elif isinstance(cur, dict):
    cur=cur.get(part)
  else:
    cur=None
    break
if cur is None:
  sys.exit(1)
print(json.dumps(cur) if isinstance(cur,(dict,list)) else cur)' "$1"
}

login_resp=$(curl -sS -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

token=$(printf "%s" "$login_resp" | json_get "meta.token" || true)
if [[ -z "${token:-}" ]]; then
  echo "Failed to login. Response: $login_resp" >&2
  exit 1
fi

auth_header=( -H "Authorization: Bearer $token" -H "Content-Type: application/json" -H "ngrok-skip-browser-warning: true" )

survey_name="$SURVEY_NAME"
survey_desc="Card issuance experience feedback and follow-up assistance."

surveys_resp=$(curl -sS "${auth_header[@]}" "$API_BASE/surveys")
existing_id=$(printf "%s" "$surveys_resp" | python3 -c 'import json,sys
name="'"$SURVEY_NAME"'"
obj=json.load(sys.stdin)
items=(obj.get("data") or {}).get("surveys") or []
for item in items:
  if (item.get("name") or "").strip()==name:
    print(item.get("id") or "")
    sys.exit(0)
print("")')

if [[ -n "$existing_id" && "$FORCE_SEED" != "1" ]]; then
  survey_id="$existing_id"
else
  create_resp=$(curl -sS -X POST "${auth_header[@]}" \
    -d "{\"name\":\"$survey_name\",\"description\":\"$survey_desc\"}" \
    "$API_BASE/surveys")
  survey_id=$(printf "%s" "$create_resp" | python3 -c 'import json,sys
obj=json.load(sys.stdin)
print(((obj.get("data") or {}).get("survey") or {}).get("id") or "")')
  if [[ -z "$survey_id" ]]; then
    echo "Failed to create survey. Response: $create_resp" >&2
    exit 1
  fi
fi

structure_resp=$(curl -sS "${auth_header[@]}" "$API_BASE/survey-builder/${survey_id}/structure")
existing_sets=$(printf "%s" "$structure_resp" | python3 -c 'import json,sys
obj=json.load(sys.stdin)
sets=(obj.get("data") or {}).get("survey", {}).get("question_sets") or (obj.get("data") or {}).get("survey", {}).get("questionSets") or []
print(len(sets))')

if [[ "$existing_sets" != "0" && "$FORCE_SEED" != "1" ]]; then
  echo "Survey already has question sets. Skipping seed. Survey ID: $survey_id"
  create_campaign_if_needed
  exit 0
fi

create_set() {
  local title="$1"
  local description="$2"
  local resp
  resp=$(curl -sS -X POST "${auth_header[@]}" \
    -d "{\"title\":\"$title\",\"description\":\"$description\",\"isActive\":true}" \
    "$API_BASE/survey-builder/${survey_id}/sets")
  printf "%s" "$resp" | python3 -c 'import json,sys
obj=json.load(sys.stdin)
print(((obj.get("data") or {}).get("questionSet") or {}).get("id") or "")'
}

create_question() {
  local set_id="$1"
  local payload="$2"
  local resp
  resp=$(curl -sS -X POST "${auth_header[@]}" \
    -d "$payload" \
    "$API_BASE/survey-builder/sets/${set_id}/questions")
  printf "%s" "$resp" | python3 -c 'import json,sys
obj=json.load(sys.stdin)
print(((obj.get("data") or {}).get("question") or {}).get("id") or "")'
}

create_rule() {
  local question_id="$1"
  local payload="$2"
  curl -sS -X POST "${auth_header[@]}" \
    -d "$payload" \
    "$API_BASE/survey-builder/questions/${question_id}/rules" >/dev/null
}

create_campaign_if_needed() {
  if [[ "$CREATE_CAMPAIGN" != "1" ]]; then
    return 0
  fi

  local campaigns_resp existing_campaign_id campaign_id create_payload create_resp
  campaigns_resp=$(curl -sS "${auth_header[@]}" "$API_BASE/campaigns")
  existing_campaign_id=$(printf "%s" "$campaigns_resp" | python3 -c 'import json,sys
name="'"$CAMPAIGN_NAME"'"
obj=json.load(sys.stdin)
def extract_items(payload):
  if isinstance(payload, dict):
    if "data" in payload:
      data = payload.get("data")
      if isinstance(data, dict) and "campaigns" in data:
        return data.get("campaigns") or []
      if isinstance(data, list):
        return data
    if "campaigns" in payload:
      return payload.get("campaigns") or []
  return []
items = extract_items(obj) or []
for item in items:
  if (item.get("name") or "").strip() == name:
    print(item.get("id") or "")
    sys.exit(0)
print("")')

  if [[ -n "$existing_campaign_id" && "$CAMPAIGN_FORCE_SEED" != "1" ]]; then
    echo "Campaign already exists. Skipping campaign creation. Campaign ID: $existing_campaign_id"
    return 0
  fi

  create_payload=$(printf '{"name":"%s","description":"%s","assignment_mode":"%s","survey_ids":["%s"],"is_active":true}' \
    "$CAMPAIGN_NAME" "$CAMPAIGN_DESC" "$CAMPAIGN_ASSIGNMENT_MODE" "$survey_id")
  create_resp=$(curl -sS -X POST "${auth_header[@]}" \
    -d "$create_payload" \
    "$API_BASE/campaigns")
  campaign_id=$(printf "%s" "$create_resp" | python3 -c 'import json,sys
obj=json.load(sys.stdin)
data=obj.get("data")
if isinstance(data, dict) and isinstance(data.get("data"), dict):
  print(data.get("data", {}).get("id") or "")
else:
  print((data or {}).get("id") if isinstance(data, dict) else "")')

  if [[ -z "$campaign_id" ]]; then
    echo "Failed to create campaign. Response: $create_resp" >&2
    return 1
  fi

  echo "Campaign created. Campaign ID: $campaign_id"
}

main_set=$(create_set "Main Flow" "Primary feedback questions")
other_reason_set=$(create_set "Other Reason" "Shown when customer selects other")
product_need_set=$(create_set "Product Interest" "Shown when customer needs assistance")
loan_type_set=$(create_set "Loan Type" "Shown when loan is selected")
product_need_other_set=$(create_set "Other Product Details" "Shown when other product is selected")

if [[ -z "$main_set" || -z "$other_reason_set" || -z "$product_need_set" || -z "$loan_type_set" || -z "$product_need_other_set" ]]; then
  echo "Failed to create one or more question sets." >&2
  exit 1
fi

satisfaction_q=$(create_question "$main_set" '{"label":"আপনি সম্প্রতি ব্র্যাক ব্যাংক থেকে একটি Gold Flexi / Platinum Flexi / Mastercard Millennial / Mastercard World / Mastercard TARA World / Visa TARA Platinum / Visa Signature / VISA Infinite / DCI Emerald ডেবিট বা ক্রেডিট কার্ড নিয়েছেন। ব্র্যাক ব্যাংক থেকে কার্ড করার অভিজ্ঞতা কেমন ছিল?","type":"rating","required":true,"ratingRange":{"min":1,"max":3}}')

reason_q=$(create_question "$main_set" '{"label":"স্যার/ম্যাম আপনি যেহেতু রেটিং দিয়েছেন, দয়া করে তার কারণটি আমাদের জানাবেন?","type":"mcq","required":true,"options":[{"label":"কার্ডটি দ্রুত ওপেন করে পেয়েছেন","value":"fast-approval"},{"label":"কার্ড ডেলিভারি দ্রুত (১ থেকে ৩ কার্য দিবসের মধ্যে) পেয়েছেন","value":"delivery-1-3"},{"label":"কার্ড ডেলিভারি দ্রুত (৪ থেকে ৭ কার্য দিবসের মধ্যে) পেয়েছেন","value":"delivery-4-7"},{"label":"কার্ডটি স্বল্প কাগজপত্রে ওপেন করতে পেরেছেন","value":"docs-short"},{"label":"রিলেশনশিপ ম্যানেজারের পেশাদারিত্ব ও ব্যবহার সহায়ক ছিল","value":"rm-professional"},{"label":"কার্ডটি ওপেন করতে অনেক ঝামেলা হয়েছে","value":"open-hassle"},{"label":"কার্ড ডেলিভারি পেতে সময় লেগেছে (২ থেকে ৫ কার্য দিবস)","value":"delivery-2-5"},{"label":"কার্ড ডেলিভারি পেতে সময় লেগেছে (৬ থেকে ১০ কার্য দিবস)","value":"delivery-6-10"},{"label":"কার্ড ডেলিভারি পেতে সময় লেগেছে (১১ থেকে ১৫ কার্য দিবস)","value":"delivery-11-15"},{"label":"কার্ড ওপেন করতে প্রয়োজনীয় কাগজপত্রের তালিকা অনেক দীর্ঘ","value":"docs-long"},{"label":"কার্ডের ফিচারস ও বেনিফিটস রিলেশনশিপ ম্যানেজারের ব্যাখ্যা সন্তোষজনক ছিল","value":"features-explained"},{"label":"রিলেশনশিপ ম্যানেজারের আচরণ সহায়ক ছিল না","value":"rm-unhelpful"},{"label":"কার্ডের ফি ও চার্জসমূহ সন্তোষজনক","value":"fees-ok"},{"label":"কার্ডের ফিচারস ও বেনিফিটস সন্তোষজনক ছিল না","value":"features-poor"},{"label":"ব্রাঞ্চের পরিবেশ ভালো ছিল","value":"branch-good"},{"label":"কার্ডের ফি ও চার্জসমূহ সন্তোষজনক ছিল না","value":"fees-not-ok"},{"label":"ব্রাঞ্চের পরিবেশ ভালো ছিল না","value":"branch-poor"},{"label":"অন্যান্য","value":"other"}]}')

agent_feedback_q=$(create_question "$main_set" '{"label":"এজেন্ট ফিডব্যাক","type":"text","required":false}')

info_source_q=$(create_question "$main_set" '{"label":"স্যার/ম্যাম ব্র্যাক ব্যাংকে আপনি অ্যাকাউন্ট/ কার্ড ওপেন করার বিষয়ে প্রাথমিক তথ্য কীভাবে পেয়েছিলেন?","type":"mcq","required":true,"options":[{"label":"ব্যাংকের প্রতিনিধি থেকে","value":"bank-rep"},{"label":"ফেইসবুক পেজ / অন্য সোশ্যাল মিডিয়ার মাধ্যমে","value":"social-media"},{"label":"ব্র্যাক ব্যাংকের ওয়েবসাইট","value":"website"},{"label":"সংবাদপত্র","value":"newspaper"},{"label":"ব্রাঞ্চ / সাবব্রাঞ্চ / এটিএম-এর বিজ্ঞাপন","value":"branch-ad"},{"label":"অন্যের মুখে (Word of Mouth)","value":"word-of-mouth"},{"label":"অন্যান্য","value":"other"}]}')

other_bank_products_q=$(create_question "$main_set" '{"label":"আপনি কি বর্তমানে ব্র্যাক ব্যাংক ছাড়া অন্য কোনো ব্যাংকের অন্য কোনো প্রোডাক্ট ব্যবহার করছেন?","type":"checkbox","required":true,"options":[{"label":"কারেন্ট/সেভিংস অ্যাকাউন্ট","value":"current-savings"},{"label":"ফিক্সড ডিপোজিট/এফডিআর","value":"fdr"},{"label":"ডিপিএস","value":"dps"},{"label":"ক্রেডিট কার্ড","value":"credit-card"},{"label":"পারসোনাল লোন","value":"personal-loan"},{"label":"কার লোন","value":"car-loan"},{"label":"হোম লোন","value":"home-loan"},{"label":"অন্যান্য","value":"other"}]}')

assistance_q=$(create_question "$main_set" '{"label":"স্যার/ম্যাম এই মুহূর্তে আপনার কি আমাদের কোনো প্রোডাক্ট অথবা সার্ভিসের প্রয়োজন আছে? বা আপনার কি আর কোনো প্রশ্ন আছে যেখানে আমরা সাহায্য করতে পারি?","type":"yesno","required":true}')

other_reason_q=$(create_question "$other_reason_set" '{"label":"অন্যান্য কারণ লিখুন","type":"text","required":false}')

product_need_q=$(create_question "$product_need_set" '{"label":"আপনি কোন প্রোডাক্ট নিতে চান?","type":"mcq","required":true,"options":[{"label":"Credit Card","value":"credit-card"},{"label":"Loan","value":"loan"},{"label":"Fixed Deposit","value":"fixed-deposit"},{"label":"DPS","value":"dps"},{"label":"Others","value":"others"}]}')

loan_type_q=$(create_question "$loan_type_set" '{"label":"Loan এর ধরন নির্বাচন করুন","type":"mcq","required":true,"options":[{"label":"Personal","value":"loan-personal"},{"label":"Home","value":"loan-home"},{"label":"Auto","value":"loan-auto"}]}')

product_need_other_q=$(create_question "$product_need_other_set" '{"label":"অন্যান্য প্রয়োজনীয়তা/প্রোডাক্টের নাম/লোন অ্যামাউন্ট লিখুন (ঐচ্ছিক)","type":"text","required":false}')

if [[ -z "$reason_q" || -z "$info_source_q" || -z "$other_bank_products_q" || -z "$assistance_q" || -z "$product_need_q" ]]; then
  echo "Failed to create one or more questions." >&2
  exit 1
fi

create_rule "$reason_q" "{\"condition\":\"equals\",\"value\":\"other\",\"targetSetId\":\"$other_reason_set\"}"
create_rule "$assistance_q" "{\"condition\":\"equals\",\"value\":\"yes\",\"targetSetId\":\"$product_need_set\"}"
create_rule "$product_need_q" "{\"condition\":\"equals\",\"value\":\"loan\",\"targetSetId\":\"$loan_type_set\"}"
create_rule "$product_need_q" "{\"condition\":\"equals\",\"value\":\"others\",\"targetSetId\":\"$product_need_other_set\"}"

create_campaign_if_needed

echo "Seed complete. Survey ID: $survey_id"
