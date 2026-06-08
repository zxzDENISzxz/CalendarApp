using System.ComponentModel.DataAnnotations;

namespace CalendarApp.Api.DTOs;

public class CreateTaskDto
{
    public const int MaxTitleLength = 100;
    [Required(ErrorMessage = "Название задачи обязательно для заполнения")]
    [StringLength(MaxTitleLength, ErrorMessage = "Название не может быть длиннее {1} символов")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTime StartAt { get; set; }

    [Required]
    public DateTime EndAt { get; set; }

    public bool IsExternal { get; set; }

    // Вместо целых объектов передаем только ID группы, если она есть
    public int? GroupId { get; set; }

    public List<int> UserIds { get; set; } = new ();
}