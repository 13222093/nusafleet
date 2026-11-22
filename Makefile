.PHONY: install run demo check format test api dashboard help

UV := uv

install:
	$(UV) sync

# Solve one scenario and print the fleet plan in the terminal
run:
	$(UV) run python main.py --scenario A_grid --quick

# Solve the baseline plus the 3 power scenarios and write outputs/*.json
demo:
	$(UV) run python main.py

check:
	$(UV) run ruff check .
	$(UV) run ruff format --check .
	$(UV) run pytest -q

format:
	$(UV) run ruff format .
	$(UV) run ruff check --fix .

test:
	$(UV) run pytest -q

api:
	$(UV) run uvicorn api.main:app --reload --port 8000

dashboard:
	cd dashboard && npm install && npm run dev

help:
	@echo "install    Install dependencies with uv"
	@echo "run        Solve one scenario and print the fleet plan"
	@echo "demo       Solve baseline + 3 scenarios, write outputs/*.json"
	@echo "check      ruff + pytest"
	@echo "format     Auto-format code"
	@echo "api        Start the FastAPI server on port 8000"
	@echo "dashboard  Start the React dashboard"
