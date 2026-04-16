package com.familycal.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FamilyCalProperties.class)
public class FamilyCalPropertiesConfig {
}
