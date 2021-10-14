import { ApiProperty } from '@nestjs/swagger';

export class UpdateDraftPostDto {
  @ApiProperty()
  content: string;
}
