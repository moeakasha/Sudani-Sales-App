# Sales Agents - Login Page

A React login page implementation following Clean Architecture principles.

## Project Structure

This project follows Clean Architecture with clear separation of concerns:

```
src/
├── domain/                    # Business logic layer
│   ├── entities/              # Domain entities (User, LoginCredentials)
│   └── use-cases/            # Business use cases (LoginUseCase)
├── application/              # Application layer
│   └── interfaces/           # Repository interfaces (IAuthRepository)
├── infrastructure/           # Infrastructure layer
│   └── api/                  # API implementations (AuthRepository)
└── presentation/              # Presentation layer
    ├── components/           # Reusable UI components
    │   ├── Logo.tsx
    │   ├── Footer.tsx
    │   └── LoginForm.tsx
    ├── pages/                # Page components
    │   └── LoginPage.tsx
    └── styles/               # Component styles
```

## Architecture Layers

### Domain Layer
- **Entities**: Core business objects (`User`, `LoginCredentials`)
- **Use Cases**: Business logic and validation (`LoginUseCase`)

### Application Layer
- **Interfaces**: Contracts for repositories (`IAuthRepository`)

### Infrastructure Layer
- **API**: Implementation of repository interfaces (`AuthRepository`)

### Presentation Layer
- **Components**: Reusable UI components
- **Pages**: Page-level components that orchestrate the UI

## Features

- ✅ Clean Architecture implementation
- ✅ TypeScript for type safety
- ✅ Form validation
- ✅ Error handling
- ✅ Responsive design
- ✅ Modern UI with gradient background
- ✅ Logo and Footer SVG assets integrated

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

The login page includes:
- Email and password input fields
- Form validation
- Error message display
- Loading states
- "Forgot password" link

The authentication flow uses the Clean Architecture pattern:
1. User submits form → `LoginForm` component
2. Form calls `LoginPage.handleLogin`
3. `LoginPage` uses `LoginUseCase` to execute business logic
4. `LoginUseCase` validates and calls `AuthRepository`
5. `AuthRepository` handles the API call (currently simulated)

## Assets

- Logo: `src/assets/Logo.svg`
- Footer: `src/assets/Footer.svg`

## Technologies

- React 19
- TypeScript
- Vite
- CSS3
