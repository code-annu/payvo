import "reflect-metadata";
import { describe, it, expect } from "vitest";
import MerchantMapper from "../merchant.mapper.js";
import type { Merchant as PrismaMerchant } from "@payvo/database/types";

describe("MerchantMapper", () => {
  const mapper = new MerchantMapper();

  describe("toMerchantEntity", () => {
    it("should map a PrismaMerchant to a Merchant entity correctly with Date conversions", () => {
      const dateStr = "2026-09-16T10:00:00.000Z";
      const prismaMerchant = {
        id: "merchant-123",
        mid: "mid_abc123",
        userId: "user-456",
        isActive: true,
        createdAt: dateStr,
        updatedAt: dateStr,
      } as unknown as PrismaMerchant;

      const result = mapper.toMerchantEntity(prismaMerchant);

      expect(result).toEqual({
        id: "merchant-123",
        mid: "mid_abc123",
        userId: "user-456",
        isActive: true,
        createdAt: new Date(dateStr),
        updatedAt: new Date(dateStr),
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("toUserMerchantsEntity", () => {
    it("should map a list of merchants to a UserMerchants entity", () => {
      const userId = "user-456";
      const merchants = [
        {
          id: "m-1",
          mid: "mid-1",
          isActive: true,
          userId,
          createdAt: "2026-09-16T10:00:00.000Z",
          updatedAt: "2026-09-16T10:00:00.000Z",
        },
        {
          id: "m-2",
          mid: "mid-2",
          isActive: false,
          userId,
          createdAt: "2026-09-16T10:00:00.000Z",
          updatedAt: "2026-09-16T10:00:00.000Z",
        },
      ] as unknown as PrismaMerchant[];

      const result = mapper.toUserMerchantsEntity(userId, merchants);

      expect(result).toEqual({
        userId,
        merchants: [
          {
            id: "m-1",
            mid: "mid-1",
            isActive: true,
          },
          {
            id: "m-2",
            mid: "mid-2",
            isActive: false,
          },
        ],
      });
    });

    it("should handle empty merchants list", () => {
      const userId = "user-empty";
      const result = mapper.toUserMerchantsEntity(userId, []);

      expect(result).toEqual({
        userId,
        merchants: [],
      });
    });
  });

  describe("DI Container Binding", () => {
    it("should resolve MerchantMapper and MerchantRepository from container", async () => {
      const { Container } = await import("inversify");
      const { default: TYPES } = await import("@/core/di/inversify.types.js");
      const { default: MerchantRepository } = await import(
        "../repository/merchant.repository.js"
      );

      const container = new Container();
      container.bind(TYPES.MerchantMapper).to(MerchantMapper);
      container.bind(TYPES.MerchantRepository).to(MerchantRepository);

      const mapperInstance = container.get<MerchantMapper>(
        TYPES.MerchantMapper,
      );
      expect(mapperInstance).toBeInstanceOf(MerchantMapper);

      const repoInstance = container.get<MerchantRepository>(
        TYPES.MerchantRepository,
      );
      expect(repoInstance).toBeInstanceOf(MerchantRepository);
    });
  });
});
