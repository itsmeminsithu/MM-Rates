.PHONY: demo web-install web-test web-start android-test verify

demo:
	cd Web && python3 scripts/demo_server.py

web-install:
	cd Web && npm ci

web-test:
	cd Web && npm run check && npm test

web-start:
	cd Web && npm start

android-test:
	cd Android && ./gradlew test assembleDebug

verify:
	bash scripts/verify-repository.sh
