ALTER TABLE `Provider`
  ADD COLUMN `bankNamePen` VARCHAR(191) NOT NULL DEFAULT "",
  ADD COLUMN `bankAccountPen` VARCHAR(191) NOT NULL DEFAULT "",
  ADD COLUMN `bankCciPen` VARCHAR(191) NOT NULL DEFAULT "",
  ADD COLUMN `detraccionAccountPen` VARCHAR(191) NOT NULL DEFAULT "",
  ADD COLUMN `bankNameUsd` VARCHAR(191) NOT NULL DEFAULT "",
  ADD COLUMN `bankAccountUsd` VARCHAR(191) NOT NULL DEFAULT "",
  ADD COLUMN `bankCciUsd` VARCHAR(191) NOT NULL DEFAULT "",
  ADD COLUMN `detraccionAccountUsd` VARCHAR(191) NOT NULL DEFAULT "";

UPDATE `Provider`
SET
  `bankNamePen` = COALESCE(NULLIF(`bankNamePen`, ""), `bankName`, ""),
  `bankAccountPen` = COALESCE(NULLIF(`bankAccountPen`, ""), `bankAccount`, ""),
  `bankCciPen` = COALESCE(NULLIF(`bankCciPen`, ""), `bankCci`, ""),
  `detraccionAccountPen` = COALESCE(NULLIF(`detraccionAccountPen`, ""), `detraccionAccount`, "")
WHERE
  (`bankNamePen` = "" OR `bankAccountPen` = "" OR `bankCciPen` = "" OR `detraccionAccountPen` = "");