package com.example.urbanpulse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.context-service.projection.enabled=false")
class UrbanpulseApplicationTests {

	@Test
	void contextLoads() {
	}

}
