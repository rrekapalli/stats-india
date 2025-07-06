# Stats India

A comprehensive platform for exploring statistical data about India, built with Spring Boot and Angular.

## Technologies Used

### Backend
- Java 21
- Spring Boot 3.2.0
- Spring Data JPA
- PostgreSQL Database
- Apache Trino for database querying
- RESTful API

### Frontend
- Angular 20
- Bootstrap 5
- TypeScript
- HTML/SCSS

## Features

- View statistical data across various categories (Population, Economy, Education, Health, Agriculture)
- Filter statistics by category, state, and metric
- Add, edit, and delete statistical data
- Responsive design for all devices

## Setup Instructions

### Prerequisites
- Java 21 JDK
- Node.js and npm
- Maven
- PostgreSQL (Make sure PostgreSQL server is installed and running)
  - Create a database named 'statsindia'
  - Default username: postgres
  - Default password: postgres
  - Default port: 5432
- Apache Trino (Optional, for enhanced query performance)
  - The application is configured to connect to a Trino server at trino.tailce422e.ts.net:8080
  - Trino should be configured with a PostgreSQL connector to the statsindia database
  - Default username: trino
  - No password is required by default

### Quick Setup with Build Scripts
We've provided convenient scripts to help you build and run the application:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/stats-india.git
   cd stats-india
   ```

2. Make the scripts executable:
   ```
   chmod +x build-and-run.sh run-frontend.sh
   ```

3. Run the backend (in one terminal):
   ```
   ./build-and-run.sh
   ```
   The backend server will start on http://localhost:8080

4. Run the frontend (in another terminal):
   ```
   ./run-frontend.sh
   ```
   The frontend application will be available at http://localhost:4200

### Manual Setup

#### Backend Setup
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/stats-india.git
   cd stats-india
   ```

2. Build and run the Spring Boot application:
   ```
   mvn spring-boot:run
   ```
   The backend server will start on http://localhost:8080

#### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd src/main/resources/static/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Angular development server:
   ```
   npm start
   ```
   The frontend application will be available at http://localhost:4200

## API Endpoints

- `GET /api/statistics` - Get all statistics
- `GET /api/statistics/{id}` - Get a specific statistic by ID
- `POST /api/statistics` - Create a new statistic
- `PUT /api/statistics/{id}` - Update an existing statistic
- `DELETE /api/statistics/{id}` - Delete a statistic
- `GET /api/statistics/category/{category}` - Get statistics by category
- `GET /api/statistics/state/{state}` - Get statistics by state
- `GET /api/statistics/metric/{metric}` - Get statistics by metric
- `GET /api/statistics/date-range?startDate={startDate}&endDate={endDate}` - Get statistics by date range
- `GET /api/statistics/category/{category}/state/{state}` - Get statistics by category and state

## Project Structure

### Backend
- `src/main/java/com/example/statsindia/model` - Entity classes
- `src/main/java/com/example/statsindia/repository` - Data repositories
- `src/main/java/com/example/statsindia/service` - Business logic
- `src/main/java/com/example/statsindia/controller` - REST controllers
- `src/main/java/com/example/statsindia/config` - Configuration classes

## Database Architecture

The application uses a dual-database approach:

1. **Apache Trino** - Used for read operations (queries) to provide high-performance analytics capabilities
   - All read operations first attempt to use Trino
   - Configured in `TrinoConfig.java` and used by `TrinoQueryService.java`

2. **PostgreSQL** - Used as the primary data store and for all write operations
   - All write operations (create, update, delete) use PostgreSQL via Spring Data JPA
   - Acts as a fallback for read operations if Trino is unavailable
   - Configured via standard Spring Boot properties

This architecture provides the best of both worlds: the reliability and ACID compliance of PostgreSQL for data storage, and the high-performance query capabilities of Trino for data analysis.

### Frontend
- `src/main/resources/static/frontend/src/app/components` - Angular components
- `src/main/resources/static/frontend/src/app/models` - TypeScript interfaces
- `src/main/resources/static/frontend/src/app/services` - Angular services

## License

This project is licensed under the MIT License - see the LICENSE file for details.
