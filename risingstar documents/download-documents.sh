#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

curl -L --fail --retry 3 --output "winter-elite-5v5-event-waiver.pdf" "https://soccer.sincsports.com/photos/tid/RISING52/user/Winter_Elite_5v5_TEAM_Liability_Waiver.pdf?v=000000100121"
curl -L --fail --retry 3 --output "winter-elite-5v5-covid-waiver.pdf" "https://soccer.sincsports.com/photos/tid/RISING52/user/Winter_Elite_5v5_TEAM_COVID_Waiver.pdf?v=000000100121"
curl -L --fail --retry 3 --output "5v5-covid-19-guidelines.pdf" "https://soccer.sincsports.com/photos/tid/RISING5/user/RSA_COVID-19..pdf"
curl -L --fail --retry 3 --output "5v5-tournament-policy.pdf" "https://soccer.sincsports.com/photos/tid/RISING52/user/RSA_Tournament_Policy_2024.pdf?v=000000051523"
curl -L --fail --retry 3 --output "5v5-tournament-rules.pdf" "https://www.risingstarsatl.org/_files/resources/documents/Rising%20Stars%20Atlanta%205v5%20Tournament%20Rule.pdf"
curl -L --fail --retry 3 --output "7v7-series-policy.pdf" "https://www.risingstarsatl.org/_files/resources/documents/Rising%20Stars%20Atlanta%207v7%20Series%20Policy.pdf"
curl -L --fail --retry 3 --output "7v7-series-rules.pdf" "https://www.risingstarsatl.org/_files/resources/documents/Rising%20Stars%20Atlanta%207v7%20Series%20Rules.pdf"
curl -L --fail --retry 3 --output "7v7-covid-19-guideline.pdf" "https://www.risingstarsatl.org/_files/resources/documents/COVID-19%207v7%20Series%20Guidline.pdf"
curl -L --fail --retry 3 --output "7v7-summer-series-covid-waiver.pdf" "https://www.risingstarsatl.org/_files/resources/documents/RSA%20Elite%207v7%20Series%20Covid%2019%20waiver.pdf"
curl -L --fail --retry 3 --output "7v7-summer-series-event-waiver.pdf" "https://www.risingstarsatl.org/_files/resources/documents/RSA%207V7%20Series%20Waiver%20of%20liability.pdf"

echo "Downloaded 10 Rising Stars ATL document PDFs into $(pwd)"
