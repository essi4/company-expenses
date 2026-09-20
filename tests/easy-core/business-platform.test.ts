import { describe, expect, it } from "vitest";
import { getBusinessBlueprint } from "@/packages/easy-platform/core/business-blueprints";
import { calculateSettlement } from "@/packages/easy-platform/core/financial";
import { CORE_MODULES } from "@/packages/easy-platform/core/business-modules";

describe("EASY Business Core", () => {
  it("provides a complete blueprint for every supported category", () => {
    const categories = ["Beauty","Automotive","Medical","Retail","Services","Hospitality","Education","Fitness","Professional","Other"] as const;
    for (const category of categories) {
      const blueprint = getBusinessBlueprint(category);
      expect(blueprint.modes.length).toBeGreaterThan(0);
      expect(blueprint.defaultModules).toHaveLength(CORE_MODULES.length);
      expect(new Set(blueprint.defaultModules.map((m) => m.id)).size).toBe(CORE_MODULES.length);
    }
  });

  it("keeps financial settlement arithmetic bounded and deterministic", () => {
    expect(calculateSettlement(1_000_000, 100_000, 500_000)).toEqual({
      gross: 1_000_000, discount: 100_000, net: 900_000,
      paid: 500_000, due: 400_000, status: "partially_paid",
    });
    expect(calculateSettlement(1_000_000, 9_000_000, 5_000_000).status).toBe("paid");
    expect(calculateSettlement(1_000_000, 100_000, 9_000_000).paid).toBe(900_000);
  });
});
