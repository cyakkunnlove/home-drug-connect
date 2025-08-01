#!/bin/bash

echo "=== Service Client Test ==="
echo "Testing endpoint: https://home-drug-connect-163owwm3n-cyakkunnloves-projects.vercel.app/api/debug/test-service-client"
echo ""

curl -s https://home-drug-connect-163owwm3n-cyakkunnloves-projects.vercel.app/api/debug/test-service-client | python3 -m json.tool

echo ""
echo "=== Test complete ==="