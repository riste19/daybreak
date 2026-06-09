// NestJS decorators read metadata via reflect-metadata. Importing it once here
// lets us construct decorated providers (e.g. GenerationService) directly in
// tests without spinning up the full Nest DI container.
import "reflect-metadata";
