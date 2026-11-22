"""API tests: live solve endpoint and error handling."""

from fastapi.testclient import TestClient

from api.main import app


client = TestClient(app)


def test_solve_returns_a_plan():
    response = client.post("/solve", json={"scenario_id": "A_grid"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "Optimal"
    assert body["fleet_plan"]
    assert body["kpis"]["annual_cost_rp"] > 0


def test_solve_applies_overrides():
    base = client.post("/solve", json={"scenario_id": "A_grid"}).json()
    pricey = client.post(
        "/solve", json={"scenario_id": "A_grid", "diesel_price_rp_per_l": 26000}
    ).json()
    assert pricey["kpis"]["annual_cost_rp"] > base["kpis"]["annual_cost_rp"]


def test_unknown_scenario_is_404():
    assert client.post("/solve", json={"scenario_id": "nope"}).status_code == 404
    assert client.get("/scenarios/nope").status_code == 404


def test_invalid_override_is_rejected():
    response = client.post(
        "/solve", json={"scenario_id": "A_grid", "diesel_price_rp_per_l": -5}
    )
    assert response.status_code == 422
