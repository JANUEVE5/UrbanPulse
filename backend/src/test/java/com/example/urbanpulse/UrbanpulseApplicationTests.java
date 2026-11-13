package com.example.urbanpulse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.opendata.sync.enabled=false")
class UrbanpulseApplicationTests {

	@Test
	void contextLoads() {
	}

}
