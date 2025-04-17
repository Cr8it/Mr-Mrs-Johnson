-- Fix boolean values for isChild in Guest table
UPDATE "Guest"
SET "isChild" = CASE 
    WHEN "isChild"::text = 'TRUE' THEN true
    WHEN "isChild"::text = 'FALSE' THEN false
    ELSE "isChild"::boolean
END;

-- Fix boolean values for isTeenager in Guest table
UPDATE "Guest"
SET "isTeenager" = CASE 
    WHEN "isTeenager"::text = 'TRUE' THEN true
    WHEN "isTeenager"::text = 'FALSE' THEN false
    ELSE "isTeenager"::boolean
END;

-- Fix boolean values for isActive in MealOption table
UPDATE "MealOption"
SET "isActive" = CASE 
    WHEN "isActive"::text = 'TRUE' THEN true
    WHEN "isActive"::text = 'FALSE' THEN false
    ELSE "isActive"::boolean
END;

-- Fix boolean values for isChildOption in MealOption table
UPDATE "MealOption"
SET "isChildOption" = CASE 
    WHEN "isChildOption"::text = 'TRUE' THEN true
    WHEN "isChildOption"::text = 'FALSE' THEN false
    ELSE "isChildOption"::boolean
END;

-- Fix boolean values for isActive in DessertOption table
UPDATE "DessertOption"
SET "isActive" = CASE 
    WHEN "isActive"::text = 'TRUE' THEN true
    WHEN "isActive"::text = 'FALSE' THEN false
    ELSE "isActive"::boolean
END;

-- Fix boolean values for isChildOption in DessertOption table
UPDATE "DessertOption"
SET "isChildOption" = CASE 
    WHEN "isChildOption"::text = 'TRUE' THEN true
    WHEN "isChildOption"::text = 'FALSE' THEN false
    ELSE "isChildOption"::boolean
END; 