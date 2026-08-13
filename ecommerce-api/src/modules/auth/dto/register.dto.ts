import {
  IsEmail,
  IsEmpty,
  Matches,
  MinLength,
  IsString,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsEmpty({ message: 'Email must not be empty' })
  email!: string;

  @IsString()
  @IsEmpty({ message: 'Password must not be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  password!: string;

  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @IsString()
  name!: string;

  @IsBoolean()
  @IsEmpty({ message: 'Accepted term must not be empty' })
  acceptedTerms!: boolean;
}
