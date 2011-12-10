all: test

test:
	prove --exec='node' t/test.js
lint:
	jsl -stdin < mobileagent.js
test-browser:
	@echo "Access to http://localhost:9041/test/index.html"
	plackup -p 9041 -e 'use Plack::App::Directory; Plack::App::Directory->new()->to_app()'
test-setup:
	npm install qunit-tap

.PHONY: test test-browser test-setup
