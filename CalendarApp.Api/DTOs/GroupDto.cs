using System.ComponentModel.DataAnnotations;

namespace CalendarApp.Api.DTOs;

public class GroupDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Название группы обязательно для заполнения")]
    [StringLength(50, ErrorMessage = "Название группы не может быть длиннее 50 символов")]
    public string Name { get; set; } = string.Empty;

    public string? ColorHex { get; set; }
}