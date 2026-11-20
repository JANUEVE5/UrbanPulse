package com.example.urbanpulse;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UrbanAssetSchemaPersistenceTest {

    @Test
    void schemaInitializationPreservesTheLocalRf22Projection() throws IOException {
        String schema;
        try (InputStream input = getClass().getResourceAsStream("/schema.sql")) {
            if (input == null) {
                throw new IOException("schema.sql not found on the test classpath");
            }
            schema = new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }

        assertFalse(Pattern.compile("(?im)^\\s*DROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?\"UrbanAsset\"(?:\\s|;|$)")
                        .matcher(schema).find(),
                "The backend-local UrbanAsset IDs must survive application restarts");
        assertTrue(Pattern.compile("(?is)CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+\"UrbanAsset\"\\s*\\(")
                        .matcher(schema).find(),
                "Fresh databases must still initialize the local UrbanAsset projection");
        assertTrue(Pattern.compile("(?is)CREATE\\s+INDEX\\s+IF\\s+NOT\\s+EXISTS\\s+idx_urban_asset_posicion")
                        .matcher(schema).find(),
                "Repeated schema initialization must preserve/create the nearby-assets index safely");
    }
}
