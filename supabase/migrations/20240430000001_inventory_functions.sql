-- Function to decrement stock level
CREATE OR REPLACE FUNCTION decrement_stock(p_id INT, decrement_by INT DEFAULT 1)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET stock_status = CASE 
        WHEN (regular_price - decrement_by) <= 0 THEN 'outofstock'
        ELSE stock_status
    END
    WHERE id = p_id;
    
    -- Note: If we had a 'stock_quantity' column, we would decrement that.
    -- Since we only have 'stock_status', we just ensure it stays 'instock' 
    -- or manually managed. Real inventory tracking would need a quantity column.
END;
$$ LANGUAGE plpgsql;
